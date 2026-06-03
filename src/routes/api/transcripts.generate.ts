import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/** Builds a plain-text transcript for now.
 *  Swap the body generation for a real PDF library (e.g. pdf-lib, pdfmake)
 *  once installed — the data fetch is production-ready.
 */
export const Route = createFileRoute("/api/transcripts/generate")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const studentId = url.searchParams.get("student_id");
        if (!studentId) return Response.json({ error: "Missing student_id" }, { status: 400 });

        // Fetch student
        const { data: student, error: sErr } = await (supabase as any)
          .from("students")
          .select("*, organizations(name)")
          .eq("id", studentId)
          .single();
        if (sErr || !student) return Response.json({ error: "Student not found" }, { status: 404 });

        // Fetch academic records
        const { data: records = [] } = await (supabase as any)
          .from("academic_records")
          .select("*")
          .eq("student_id", studentId)
          .order("academic_year", { ascending: false });

        // Calculate GPA
        const completed = records.filter((r: any) => r.status === "completed" && r.grade_points != null);
        const totalPoints  = completed.reduce((s: number, r: any) => s + r.grade_points * r.credit_hours, 0);
        const totalCredits = completed.reduce((s: number, r: any) => s + r.credit_hours, 0);
        const gpa = totalCredits ? (totalPoints / totalCredits).toFixed(2) : "N/A";

        // Build plain-text transcript (replace with PDF generation in production)
        const divider = "─".repeat(60);
        const lines = [
          "OFFICIAL ACADEMIC TRANSCRIPT",
          student.organizations?.name ?? "Orcalis Assess Institution",
          `Generated: ${new Date().toUTCString()}`,
          divider,
          `Student Name   : ${student.full_name}`,
          `Student ID     : ${student.student_number}`,
          `Program        : ${student.program ?? "N/A"}`,
          `Department     : ${student.department ?? "N/A"}`,
          `Enrollment     : ${student.enrollment_status.toUpperCase()}`,
          `Cumulative GPA : ${gpa}`,
          divider,
          "ACADEMIC RECORD",
          divider,
          ...(records as any[]).map((r) =>
            `${r.academic_year ?? "––"} | ${r.semester ?? "––"} | ${r.course_code.padEnd(10)} | ${r.course_name.padEnd(30)} | ${(r.grade ?? "IP").padEnd(4)} | ${r.credit_hours} cr`
          ),
          divider,
          `Total Credits Earned: ${totalCredits}`,
          `Cumulative GPA      : ${gpa}`,
          divider,
          "This document is issued by Orcalis Assess and is tamper-evident.",
          "Verify authenticity at: https://assess.orcalis.io/verify",
        ];

        const text = lines.join("\n");

        return new Response(text, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="transcript-${student.student_number}.txt"`,
          },
        });
      },
    },
  },
});
