import { GoogleGenAI } from "@google/genai";

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: geminiApiKey });
const defaultModel = process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash";
const fallbackModels = (process.env.GOOGLE_AI_MODEL_FALLBACKS || "gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash-latest")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

function getModelCandidates(): string[] {
  return [...new Set([defaultModel, ...fallbackModels])];
}

function isMissingModelError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const status = "status" in error ? error.status : undefined;
  const message = "message" in error && typeof error.message === "string" ? error.message : "";

  return status === 404 || message.includes("is not found for API version") || message.includes("Call ListModels");
}

async function generateText(prompt: string): Promise<string> {
  let lastError: unknown;

  for (const modelName of getModelCandidates()) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      return response.text ?? "";
    } catch (error) {
      lastError = error;
      if (!isMissingModelError(error)) throw error;
    }
  }

  throw lastError;
}

export async function parseSyllabusPDF(pdfText: string): Promise<{
  topics: Array<{
    name: string;
    description?: string;
    estimatedMinutes: number;
    priority: "LOW" | "MEDIUM" | "HIGH";
    order: number;
  }>;
  summary: string;
}> {
  const prompt = `You are an expert academic syllabus analyzer. Parse this syllabus text and extract structured topics.

Syllabus text:
${pdfText.slice(0, 8000)}

Return ONLY valid JSON in this exact format:
{
  "topics": [
    {
      "name": "Topic name",
      "description": "Brief description",
      "estimatedMinutes": 60,
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "order": 0
    }
  ],
  "summary": "2-3 sentence overview of the syllabus"
}

Rules:
- Extract all distinct topics/chapters/units
- estimatedMinutes: 30-180 based on complexity
- priority: HIGH for core concepts, MEDIUM for applications, LOW for supplementary
- order: sequential numbering starting at 0`;

  const text = await generateText(prompt);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");

  return JSON.parse(jsonMatch[0]);
}

export async function generateStudyPlan(params: {
  subjects: Array<{ name: string; completion: number; examDate?: string; topicCount: number }>;
  availableHoursPerDay: number;
  examDate?: string;
  preferences?: string;
}): Promise<{
  schedule: Array<{
    date: string;
    sessions: Array<{ subject: string; topic: string; durationMin: number; time: string }>;
  }>;
  totalDays: number;
  summary: string;
}> {
  const prompt = `Create a detailed study plan for a student.

Subjects: ${JSON.stringify(params.subjects)}
Available study hours per day: ${params.availableHoursPerDay}
Exam date: ${params.examDate || "Not specified"}
Preferences: ${params.preferences || "None"}

Return ONLY valid JSON:
{
  "schedule": [
    {
      "date": "2024-01-15",
      "sessions": [
        { "subject": "Mathematics", "topic": "Calculus", "durationMin": 90, "time": "09:00" }
      ]
    }
  ],
  "totalDays": 14,
  "summary": "Plan overview"
}

Create a realistic 7-14 day plan with varied subjects, spaced repetition, and exam proximity weighting.`;

  const text = await generateText(prompt);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");

  return JSON.parse(jsonMatch[0]);
}

export async function getTopicRecommendations(params: {
  subject: string;
  completedTopics: string[];
  pendingTopics: string[];
  examDate?: string;
}): Promise<{
  recommendations: Array<{ topic: string; reason: string; priority: number }>;
  studyTip: string;
}> {
  const prompt = `You are a smart study advisor. Recommend which topics to study next.

Subject: ${params.subject}
Completed: ${params.completedTopics.join(", ")}
Pending: ${params.pendingTopics.join(", ")}
Exam date: ${params.examDate || "Not specified"}

Return ONLY valid JSON:
{
  "recommendations": [
    { "topic": "topic name", "reason": "why to study this next", "priority": 1 }
  ],
  "studyTip": "A personalized study tip"
}

Give top 3-5 recommendations ordered by priority (1 = highest).`;

  const text = await generateText(prompt);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");

  return JSON.parse(jsonMatch[0]);
}

export async function chatWithAI(
  message: string,
  context: { subjects?: string[]; recentTopics?: string[] }
): Promise<string> {
  const prompt = `You are Sylla, an AI study assistant. Help the student with their studies.

Student context:
- Studying: ${context.subjects?.join(", ") || "Various subjects"}
- Recent topics: ${context.recentTopics?.join(", ") || "None"}

Student message: ${message}

Respond helpfully, concisely, and encouragingly. Keep under 200 words.`;

  return generateText(prompt);
}
