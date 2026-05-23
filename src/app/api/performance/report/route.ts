import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askGemini } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["ADMIN", "PARTNER", "MANAGER"];
    if (!allowedRoles.includes(session.user.role)) {
      return Response.json(
        { error: "Forbidden: only ADMIN, PARTNER, or MANAGER can generate reports" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const period: "day" | "week" | "month" = body.period || "week";

    // Calculate date range
    const now = new Date();
    const rangeStart = new Date();
    if (period === "day") {
      rangeStart.setHours(rangeStart.getHours() - 24);
    } else if (period === "week") {
      rangeStart.setDate(rangeStart.getDate() - 7);
    } else {
      rangeStart.setDate(rangeStart.getDate() - 30);
    }

    // Fetch employees - scoped by department for MANAGER
    const whereUsers: Record<string, unknown> = {
      isActive: true,
      role: { not: "CLIENT" },
    };

    const { role, department } = session.user;
    if (role === "MANAGER" && department) {
      whereUsers.department = department;
    }

    const employees = await prisma.user.findMany({
      where: whereUsers,
      select: { id: true, name: true, email: true, role: true, subRole: true, department: true },
    });

    // Gather data for each employee
    const employeeData = await Promise.all(
      employees.map(async (emp) => {
        // Tasks completed in the period
        const completedTasks = await prisma.task.findMany({
          where: {
            assignedToId: emp.id,
            status: "COMPLETED",
            completedAt: { gte: rangeStart, lte: now },
          },
          select: {
            id: true,
            title: true,
            priority: true,
            createdAt: true,
            completedAt: true,
          },
        });

        // Tasks created/assigned in the period
        const createdInPeriod = await prisma.task.count({
          where: {
            assignedToId: emp.id,
            createdAt: { gte: rangeStart, lte: now },
          },
        });

        // Currently active tasks
        const activeTasks = await prisma.task.count({
          where: {
            assignedToId: emp.id,
            status: { in: ["TODO", "IN_PROGRESS", "REVIEW"] },
          },
        });

        // Status history entries in the period (pickup times, review times)
        const statusHistory = await prisma.taskStatusHistory.findMany({
          where: {
            task: { assignedToId: emp.id },
            changedAt: { gte: rangeStart, lte: now },
          },
          select: {
            fromStatus: true,
            toStatus: true,
            changedAt: true,
            taskId: true,
          },
        });

        // Calculate metrics
        const tasksCompletedCount = completedTasks.length;

        // Avg completion time in hours
        let avgCompletionHours = 0;
        const completedWithTime = completedTasks.filter((t) => t.completedAt);
        if (completedWithTime.length > 0) {
          const totalHours = completedWithTime.reduce((sum, t) => {
            const hours =
              (t.completedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }, 0);
          avgCompletionHours = Math.round((totalHours / completedWithTime.length) * 10) / 10;
        }

        // Tasks picked up (TODO -> IN_PROGRESS)
        const tasksPickedUp = statusHistory.filter(
          (h) => h.fromStatus === "TODO" && h.toStatus === "IN_PROGRESS"
        ).length;

        // Tasks sent back (REVIEW -> IN_PROGRESS = revisions)
        const tasksSentBack = statusHistory.filter(
          (h) => h.fromStatus === "REVIEW" && h.toStatus === "IN_PROGRESS"
        ).length;

        return {
          userId: emp.id,
          name: emp.name,
          email: emp.email,
          role: emp.subRole || emp.role,
          department: emp.department,
          tasksCompleted: tasksCompletedCount,
          avgCompletionHours,
          tasksAssignedInPeriod: createdInPeriod,
          activeTasks,
          tasksPickedUp,
          tasksSentBack,
          completedTaskDetails: completedTasks.map((t) => ({
            title: t.title,
            priority: t.priority,
            hoursToComplete: t.completedAt
              ? Math.round(
                  ((t.completedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60)) * 10
                ) / 10
              : null,
          })),
        };
      })
    );

    const deptLabel = department || "all departments";

    const prompt = `You are a performance analyst for Kreston Albania's ${deptLabel} department.

Generate a ${period} performance report for each employee. Score them 1-100 relative to each other.

For each employee provide:
1. Score (1-100)
2. A short performance summary (2-3 sentences)
3. Tips for the manager on how to help this employee improve
4. List of tasks they completed in this period (title, priority, how long it took)

Employee Data:
${JSON.stringify(employeeData, null, 2)}

Consider:
- Task difficulty (URGENT/HIGH tasks are harder than LOW)
- Speed (faster completion = better)
- Quality (fewer revisions/send-backs = better)
- Volume (more tasks completed = better, but quality matters more)
- Compare employees relative to each other

Return a JSON object with this EXACT structure (no markdown, no extra text, ONLY the JSON):
{
  "period": "${period}",
  "generatedAt": "${now.toISOString()}",
  "overallSummary": "2-3 sentence department health summary",
  "employees": [
    {
      "userId": "...",
      "name": "...",
      "score": 85,
      "summary": "Strong performer this week...",
      "managerTips": "Consider assigning more complex tasks...",
      "completedTasks": [
        { "title": "...", "priority": "HIGH", "hoursToComplete": 12 }
      ]
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. No markdown code fences. No explanatory text before or after.`;

    const aiResponse = await askGemini(prompt);

    // Parse JSON from response - handle markdown code blocks
    let jsonStr = aiResponse.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Save to DB
    if (department) {
      await prisma.performanceReport.create({
        data: {
          department: department as any,
          period,
          generatedById: session.user.id,
          report: parsed,
        },
      });
    }

    return Response.json(parsed);
  } catch (error) {
    console.error("Error generating performance report:", error);
    return Response.json(
      { error: "Failed to generate performance report" },
      { status: 500 }
    );
  }
}
