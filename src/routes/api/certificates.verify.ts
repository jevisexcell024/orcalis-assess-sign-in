import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/api/certificates/verify")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const certNumber = url.searchParams.get("cert")?.toUpperCase();

        if (!certNumber) {
          return Response.json({ error: "Missing cert parameter" }, { status: 400 });
        }

        const { data, error } = await (supabase as any)
          .from("certificates")
          .select(`
            certificate_number, issued_at, expires_at, revoked,
            blockchain_hash, blockchain_tx,
            students(full_name, student_number),
            exams(title),
            organizations(name)
          `)
          .eq("certificate_number", certNumber)
          .single();

        if (error || !data) {
          return Response.json({ valid: false, error: "Certificate not found" }, { status: 404 });
        }

        const expired = data.expires_at ? new Date(data.expires_at) < new Date() : false;
        const valid = !data.revoked && !expired;

        return Response.json({
          valid,
          certificate_number: data.certificate_number,
          issued_at: data.issued_at,
          expires_at: data.expires_at,
          revoked: data.revoked,
          blockchain_hash: data.blockchain_hash,
          holder: data.students?.full_name,
          student_number: data.students?.student_number,
          exam: data.exams?.title,
          institution: data.organizations?.name,
        });
      },
    },
  },
});
