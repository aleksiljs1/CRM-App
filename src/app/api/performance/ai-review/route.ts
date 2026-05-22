import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { askGemini } from "@/lib/gemini";
import { getPerformanceData } from "../route";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const performanceData = await getPerformanceData();

    const prompt = `You are an HR performance analyst for Kreston Albania, a professional services firm.

Analyze these employee performance metrics and provide:
1. TOP PERFORMERS: Who deserves a raise? Give specific data-backed reasons.
2. NEEDS ATTENTION: Who is struggling? Diagnose WHY (overloaded? undertrained? disengaged?)
3. BURNOUT RISK: Who might be at risk based on high workload + declining metrics?
4. TEAM BALANCE: Which departments are overloaded vs underutilized?

Important guidelines:
- Be specific with names and numbers
- Even with limited data, provide meaningful insights
- If data is sparse, note that but still give your best analysis
- Consider role expectations (PARTNER should manage more clients, INTERN should have fewer tasks)

Employee Data:
${JSON.stringify(performanceData, null, 2)}

Return a JSON object with this EXACT structure (no markdown, no extra text, ONLY the JSON):
{
  "raiseRecommendations": [
    { "userId": "...", "name": "...", "score": 88, "recommendation": "RAISE RECOMMENDED", "confidence": "HIGH", "reasons": ["reason 1", "reason 2", "reason 3"] }
  ],
  "needsAttention": [
    { "userId": "...", "name": "...", "score": 45, "issue": "OVERLOADED", "details": "..." }
  ],
  "burnoutRisk": [
    { "userId": "...", "name": "...", "riskLevel": "HIGH", "reason": "..." }
  ],
  "departmentInsights": [
    { "department": "...", "status": "OVERLOADED", "recommendation": "..." }
  ],
  "summary": "A 2-3 sentence executive summary of the team's health"
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

    return Response.json(parsed);
  } catch (error) {
    console.error("Error in AI review:", error);
    return Response.json(
      { error: "Failed to generate AI review" },
      { status: 500 }
    );
  }
}
