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

  // Load questions for this exam, in order
  const { data: sections } = await supabase
    .from("exam_sections")
    .select("id")
    .eq("exam_id", reg.exam_id)
    .order("position", { ascending: true });
  const sectionIds = (sections ?? []).map((s) => s.id);
  let questions: Question[] = [];
  if (sectionIds.length > 0) {
    const { data: qs, error: qErr } = await supabase
      .from("questions")
      .select("*")
      .in("section_id", sectionIds)
      .order("position", { ascending: true });
    if (qErr) throw qErr;
    questions = qs ?? [];
  }

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
  // Pull attempt + its answers + questions in one go
  const { data: answers, error: aErr } = await supabase
    .from("exam_answers")
    .select("id, question_id, response")
    .eq("attempt_id", attemptId);
  if (aErr) throw aErr;

  const questionIds = (answers ?? []).map((a) => a.question_id);
  let questions: Pick<Question, "id" | "type" | "options" | "points">[] = [];
  if (questionIds.length > 0) {
    const { data: qs, error: qErr } = await supabase
      .from("questions")
      .select("id, type, options, points")
      .in("id", questionIds);
    if (qErr) throw qErr;
    questions = qs ?? [];
  }

  let score = 0;
  let maxScore = 0;
  let autoScored = true;
  for (const q of questions) {
    maxScore += q.points ?? 1;
    const ans = answers!.find((a) => a.question_id === q.id);
    if (!ans) continue;
    if (q.type === "mcq" || q.type === "true_false") {
      const opts = (q.options as unknown as QuestionOption[]) ?? [];
      const selectedIdx = (ans.response as { selected?: number })?.selected;
      const correctIdx = opts.findIndex((o) => o.is_correct);
      const isCorrect = selectedIdx === correctIdx && correctIdx >= 0;
      const pts = isCorrect ? q.points ?? 1 : 0;
      if (isCorrect) score += pts;
      await supabase
        .from("exam_answers")
        .update({ is_correct: isCorrect, points_awarded: pts })
        .eq("id", ans.id);
    } else {
      autoScored = false;
    }
  }

  const { error: updErr } = await supabase
    .from("exam_attempts")
    .update({
      submitted_at: new Date().toISOString(),
      score,
      max_score: maxScore,
      auto_scored: autoScored,
    })
    .eq("id", attemptId);
  if (updErr) throw updErr;

  // Mirror onto the registration for legacy queries
  await supabase
    .from("exam_registrations")
    .update({ score, status: "completed" })
    .eq("id", (await supabase.from("exam_attempts").select("registration_id").eq("id", attemptId).single()).data!.registration_id);

  return { score, maxScore, autoScored };
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
      options:
        input.type === "mcq"
          ? [
              { text: "", is_correct: true },
              { text: "", is_correct: false },
            ]
          : [],
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}