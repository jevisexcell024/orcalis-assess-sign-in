import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUser } from "./-_auth";

export const Route = createFileRoute("/api/results/export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await getAuthenticatedUser(request);
        const url = new URL(request.url);
        const format = url.searchParams.get("format") ?? "csv";
        const orgId = url.searchParams.get("org_id");

        let q = (supabase as any)
          .from("results")
          .select(`
            id, raw_score, max_score, percentage, grade, status, published_at,
            exam_registrations(candidate_id, exams(title))
          `)
          .eq("status", "published");

        if (orgId) q = q.eq("organization_id", orgId);
        const { data, error } = await q;
        if (error) return Response.json({ error: error.message }, { status: 500 });

        if (format === "csv") {
          const headers = ["Result ID", "Exam", "Score", "Max Score", "Percentage", "Grade", "Status", "Published At"];
          const rows = (data ?? []).map((r: any) => [
            r.id,
            r.exam_registrations?.exams?.title ?? "",
            r.raw_score ?? "",
            r.max_score ?? "",
            r.percentage != null ? `${r.percentage.toFixed(2)}%` : "",
            r.grade ?? "",
            r.status,
            r.published_at ?? "",
          ]);
          const csv = [headers, ...rows].map((row) => row.map((v: any) => `"${v}"`).join(",")).join("\n");
          return new Response(csv, {
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="results-${new Date().toISOString().slice(0,10)}.csv"`,
            },
          });
        }

        return Response.json({ results: data, count: (data ?? []).length });
      },
    },
  },
});
