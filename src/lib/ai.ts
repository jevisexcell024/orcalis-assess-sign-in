/**
 * Orcalis Assess — AI Module
 * Wraps OpenAI API calls for question generation, grading, and analysis.
 * All calls go through server-side API routes to keep the key off the client.
 */

export type QuestionType = "mcq" | "true_false" | "descriptive" | "coding";
export type Difficulty    = "easy" | "medium" | "hard";

export type GeneratedQuestion = {
  type: QuestionType;
  prompt: string;
  difficulty: Difficulty;
  points: number;
  options?: { text: string; is_correct: boolean }[];
  explanation?: string;
  tags: string[];
  subject?: string;
};

export type GenerateQuestionsInput = {
  topic: string;
  subject?: string;
  difficulty?: Difficulty;
  count?: number;
  types?: QuestionType[];
  context?: string;  // extra curriculum context
};

export async function generateQuestions(
  input: GenerateQuestionsInput,
): Promise<GeneratedQuestion[]> {
  const res = await fetch("/api/ai/generate-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "AI generation failed");
  }
  const data = await res.json();
  return (data as any).questions ?? [];
}

export type GradingInput = {
  question_prompt: string;
  student_answer: string;
  rubric?: string;
  max_points: number;
};

export type GradingResult = {
  points_awarded: number;
  feedback: string;
  reasoning: string;
};

export async function gradeDescriptiveAnswer(
  input: GradingInput,
): Promise<GradingResult> {
  const res = await fetch("/api/ai/grade-answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("AI grading failed");
  return res.json();
}

export type RiskAnalysisInput = {
  candidate_id: string;
  exam_id: string;
  proctoring_events: { event_type: string; severity: string; created_at: string }[];
  time_anomalies?: { description: string }[];
};

export type RiskAnalysisResult = {
  risk_score: number;       // 0–100
  risk_level: "low" | "medium" | "high" | "critical";
  flags: string[];
  recommendation: string;
};

export async function analyzeRisk(
  input: RiskAnalysisInput,
): Promise<RiskAnalysisResult> {
  const res = await fetch("/api/ai/analyze-risk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("AI risk analysis failed");
  return res.json();
}
