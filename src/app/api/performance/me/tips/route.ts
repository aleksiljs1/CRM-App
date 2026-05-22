import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { askGemini } from "@/lib/gemini";
import { getPerformanceData } from "../../route";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allData = await getPerformanceData();
    const myData = allData.find((d) => d.user.id === session.user.id);

    if (!myData) {
      return Response.json(
        { error: "Performance data not found" },
        { status: 404 }
      );
    }

    const prompt = `You are a career coach for an employee at Kreston Albania, a professional services firm.

Based on this employee's performance data, provide personalized tips to help them improve.

Employee: ${myData.user.name}, Role: ${myData.user.role}, Department: ${myData.user.department ?? "N/A"}
Performance Score: ${myData.performanceScore}/100
Tasks Completed: ${myData.tasksCompleted} out of ${myData.totalTasks}
On-time Rate: ${myData.onTimeRate}%
High Priority Tasks: ${myData.highPriorityCompleted}
Emails Handled: ${myData.emailsHandled}
Clients Managed: ${myData.clientsManaged}

Return a JSON object:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["specific actionable tip 1", "specific actionable tip 2", "specific actionable tip 3"],
  "nextGoal": "A specific achievable goal for next month",
  "motivation": "A short encouraging message"
}

Return ONLY the JSON object, no markdown formatting or code blocks.`;

    const response = await askGemini(prompt);

    // Parse the JSON from the response
    const cleaned = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const tips = JSON.parse(cleaned);

    return Response.json(tips);
  } catch (error) {
    console.error("Error generating tips:", error);
    return Response.json(
      { error: "Failed to generate tips" },
      { status: 500 }
    );
  }
}
