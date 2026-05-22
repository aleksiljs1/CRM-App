import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function askGemini(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}
