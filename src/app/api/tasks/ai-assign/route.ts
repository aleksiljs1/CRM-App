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

    if (!["ADMIN", "PARTNER", "MANAGER"].includes(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { taskTitle, taskDescription, taskPriority } = await request.json();
    const department = session.user.department;

    if (!department) {
      return Response.json({ error: "No department set" }, { status: 400 });
    }

    // Get all active employees in the department (exclude managers - they assign, not do)
    const employees = await prisma.user.findMany({
      where: {
        department: department as any,
        role: { in: ["SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN"] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        subRole: true,
      },
    });

    if (employees.length === 0) {
      return Response.json({ error: "No employees in department" }, { status: 400 });
    }

    // Get active task counts and workload for each employee
    const employeeData = await Promise.all(
      employees.map(async (emp) => {
        const [activeTasks, completedThisMonth, reviewTasks] = await Promise.all([
          prisma.task.count({
            where: {
              assignedToId: emp.id,
              status: { in: ["TODO", "IN_PROGRESS", "REVIEW"] },
            },
          }),
          prisma.task.count({
            where: {
              assignedToId: emp.id,
              status: "COMPLETED",
              completedAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
          }),
          prisma.task.count({
            where: {
              assignedToId: emp.id,
              status: "REVIEW",
            },
          }),
        ]);

        return {
          id: emp.id,
          name: emp.name,
          role: emp.role,
          subRole: emp.subRole,
          activeTasks,
          completedThisMonth,
          reviewTasks,
        };
      })
    );

    const prompt = `You are a task assignment assistant for Kreston Albania's ${department} department.

A manager wants to assign a new task and needs your recommendation on the best person.

NEW TASK:
- Title: "${taskTitle || "Untitled"}"
- Description: "${taskDescription || "No description"}"
- Priority: ${taskPriority || "MEDIUM"}

AVAILABLE EMPLOYEES:
${employeeData.map((e) => `- ${e.name} (${e.subRole || e.role}): ${e.activeTasks} active tasks, ${e.completedThisMonth} completed this month, ${e.reviewTasks} in review`).join("\n")}

Choose the BEST person to assign this task to. Consider:
1. Who has the FEWEST active tasks (most available capacity)
2. Who has completed the LEAST tasks this month (needs more work)
3. Role suitability (match task complexity to seniority)
4. Balance workload fairly across the team

Return ONLY a JSON object, nothing else:
{"userId": "the_user_id", "name": "their name", "reason": "one sentence explaining why this person is the best fit"}`;

    const aiResponse = await askGemini(prompt);

    let jsonStr = aiResponse;
    const codeBlockMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    const recommendation = JSON.parse(jsonStr);

    return Response.json({
      recommendation,
      employees: employeeData,
    });
  } catch (error) {
    console.error("[AI-ASSIGN] Error:", error);
    return Response.json(
      { error: "Failed to get AI recommendation" },
      { status: 500 }
    );
  }
}
