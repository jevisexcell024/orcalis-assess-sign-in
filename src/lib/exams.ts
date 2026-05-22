import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Exam = Database["public"]["Tables"]["exams"]["Row"];
export type ExamSection = Database["public"]["Tables"]["exam_sections"]["Row"];
export type Question = Database["public"]["Tables"]["questions"]["Row"];

export type QuestionOption = { text: string; is_correct: boolean };

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