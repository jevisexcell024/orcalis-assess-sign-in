import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Exam = Database["public"]["Tables"]["exams"]["Row"];
export type ExamSection = Database["public"]["Tables"]["exam_sections"]["Row"];
export type Question = Database["public"]["Tables"]["questions"]["Row"];

export type QuestionOption = { text: string; is_correct: boolean };

export type ExamAttempt = Database["public"]["Tables"]["exam_attempts"]["Row"];
export type ExamAnswer = Database["public"]["Tables"]["exam_answers"]["Row"];

// ---------- Attempts ----------

/**
 * Load (or create) the attempt for a registration, plus the questions
 * for that exam and any saved answers.
 */
export async function startOrResumeAttempt(registrationId: string) {
  const { data: reg, error: regErr } = await supabase
    .from("exam_registrations")
    .select("id, exam_id, organization_id, candidate_id")
    .eq("id", registrationId)
    .maybeSingle();
  if (regErr) throw regErr;
  if (!reg) throw new Error("Registration not found");

  // Existing attempt?
  const { data: existing } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("registration_id", registrationId)
    .maybeSingle();

  let attempt = existing;
  if (!attempt) {
    const { data: created, error: createErr } = await supabase
      .from("exam_attempts")
      .insert({
        registration_id: registrationId,
        organization_id: reg.organization_id,
      })
      .select()
      .single();
    if (createErr) throw createErr;
    attempt = created;
  }

  // Load questions via secure RPC that strips correct-answer markers.
  const { data: qs, error: qErr } = await supabase.rpc(
    "get_exam_questions_for_attempt" as never,
    { _attempt_id: attempt.id } as never,
  );
  if (qErr) throw qErr;
  type RpcRow = {
    q_id: string;
    q_section_id: string | null;
    q_position: number;
    q_type: Question["type"];
    q_prompt: string;
    q_difficulty: Question["difficulty"];
    q_points: number;
    q_options: unknown;
    q_shuffle_options: boolean;
  };
  const questions: Question[] = ((qs as unknown as RpcRow[]) ?? []).map((row) => ({
    id: row.q_id,
    section_id: row.q_section_id,
    position: row.q_position,
    type: row.q_type,
    prompt: row.q_prompt,
    difficulty: row.q_difficulty,
    points: row.q_points,
    options: row.q_options as Question["options"],
    shuffle_options: row.q_shuffle_options,
    organization_id: null,
    created_by: "",
    subject: null,
    tags: [],
    created_at: "",
    updated_at: "",
  }));

  // Load any saved answers
  const { data: answers } = await supabase
    .from("exam_answers")
    .select("*")
    .eq("attempt_id", attempt.id);

  return { attempt, questions, answers: answers ?? [] };
}

/** Upsert a single answer (called as the candidate selects/edits). */
export async function saveAnswer(input: {
  attempt_id: string;
  question_id: string;
  response: Database["public"]["Tables"]["exam_answers"]["Insert"]["response"];
}) {
  const { error } = await supabase
    .from("exam_answers")
    .upsert(
      {
        attempt_id: input.attempt_id,
        question_id: input.question_id,
        response: input.response,
      },
      { onConflict: "attempt_id,question_id" },
    );
  if (error) throw error;
}

/**
 * Auto-score MCQ/true-false answers and submit the attempt.
 * Non-MCQ answers remain ungraded (manual review).
 */
export async function submitAttempt(attemptId: string) {
  // Scoring + submission run server-side in a SECURITY DEFINER function so
  // candidates cannot tamper with their score or read correct answers.
  const { data, error } = await supabase.rpc(
    "submit_exam_attempt" as never,
    { _attempt_id: attemptId } as never,
  );
  if (error) throw error;
  const result = (data as unknown as { score: number; max_score: number; auto_scored: boolean }) ?? {
    score: 0,
    max_score: 0,
    auto_scored: true,
  };
  return { score: result.score, maxScore: result.max_score, autoScored: result.auto_scored };
}

export async function listExams() {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createExam(input: { title: string; term?: string | null }) {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("exams")
    .insert({ title: input.title, term: input.term ?? null, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getExamWithContent(examId: string) {
  const [examRes, sectionsRes] = await Promise.all([
    supabase.from("exams").select("*").eq("id", examId).single(),
    supabase
      .from("exam_sections")
      .select("*")
      .eq("exam_id", examId)
      .order("position", { ascending: true }),
  ]);
  if (examRes.error) throw examRes.error;
  if (sectionsRes.error) throw sectionsRes.error;

  const sectionIds = sectionsRes.data.map((s) => s.id);
  let questions: Question[] = [];
  if (sectionIds.length > 0) {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .in("section_id", sectionIds)
      .order("position", { ascending: true });
    if (error) throw error;
    questions = data;
  }
  return { exam: examRes.data, sections: sectionsRes.data, questions };
}

export async function updateExam(
  id: string,
  patch: Partial<Database["public"]["Tables"]["exams"]["Update"]>,
) {
  const { data, error } = await supabase
    .from("exams")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSection(
  id: string,
  patch: Partial<Database["public"]["Tables"]["exam_sections"]["Update"]>,
) {
  const { data, error } = await supabase
    .from("exam_sections")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createSection(input: { exam_id: string; title: string; position: number }) {
  const { data, error } = await supabase
    .from("exam_sections")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createQuestion(input: {
  section_id: string;
  position: number;
}) {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("questions")
    .insert({
      section_id: input.section_id,
      position: input.position,
      prompt: "",
      type: "mcq",
      difficulty: "medium",
      points: 1,
      options: [
        { text: "", is_correct: true },
        { text: "", is_correct: false },
      ],
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateQuestion(
  id: string,
  patch: Partial<Database["public"]["Tables"]["questions"]["Update"]>,
) {
  const { data, error } = await supabase
    .from("questions")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Question Bank ----------

export async function listBankQuestions() {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .is("section_id", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createBankQuestion(input: {
  prompt: string;
  type: Question["type"];
  difficulty: Question["difficulty"];
  subject?: string | null;
  tags?: string[];
  points?: number;
  options?: unknown[];
  shuffle_options?: boolean;
}) {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("questions")
    .insert({
      section_id: null,
      position: 0,
      prompt: input.prompt,
      type: input.type,
      difficulty: input.difficulty,
      subject: input.subject ?? null,
      tags: input.tags ?? [],
      points: input.points ?? 1,
      options: (
        input.options !== undefined
          ? input.options
          : input.type === "mcq"
            ? [{ text: "", is_correct: true }, { text: "", is_correct: false }]
            : []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any,
      shuffle_options: input.shuffle_options ?? (input.type === "mcq"),
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}