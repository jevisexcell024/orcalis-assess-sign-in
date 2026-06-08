import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUser } from "./-_auth";

export const Route = createFileRoute("/api/attendance/qr")({
  server: {
    handlers: {
      // GET /api/attendance/qr?code=OA-XXXXXXXX — validate a QR scan
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code")?.toUpperCase();
        const studentId = url.searchParams.get("student_id");

        if (!code) return Response.json({ error: "Missing code" }, { status: 400 });

        const { data: session, error } = await (supabase as any)
          .from("attendance_sessions")
          .select("id, title, qr_code, qr_expires_at, method, grace_period_minutes, start_time")
          .eq("qr_code", code)
          .single();

        if (error || !session) {
          return Response.json({ valid: false, error: "QR code not found" }, { status: 404 });
        }

        if (session.qr_expires_at && new Date(session.qr_expires_at) < new Date()) {
          return Response.json({ valid: false, error: "QR code expired" }, { status: 410 });
        }

        // If student_id provided, record attendance
        if (studentId) {
          const startTime = new Date(session.start_time).getTime();
          const graceMs = (session.grace_period_minutes ?? 15) * 60 * 1000;
          const isLate = Date.now() > startTime + graceMs;

          await (supabase as any)
            .from("attendance_records")
            .upsert({
              session_id: session.id,
              student_id: studentId,
              status: isLate ? "late" : "present",
              method: "qr",
              check_in_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: "session_id,student_id" });
        }

        return Response.json({
          valid: true,
          session_id: session.id,
          session_title: session.title,
          expires_at: session.qr_expires_at,
        });
      },
      // POST /api/attendance/qr — regenerate QR for a session (requires auth)
      POST: async ({ request }) => {
        await getAuthenticatedUser(request);
        const body = await request.json();
        const { session_id } = body as { session_id: string };
        if (!session_id) return Response.json({ error: "Missing session_id" }, { status: 400 });

        const code = `OA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        const { error } = await (supabase as any)
          .from("attendance_sessions")
          .update({ qr_code: code, qr_expires_at: expires, updated_at: new Date().toISOString() })
          .eq("id", session_id);

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ qr_code: code, expires_at: expires });
      },
    },
  },
});
