import { createFileRoute } from "@tanstack/react-router";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const Route = createFileRoute("/api/ai/analyze-risk")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await checkRateLimit(getClientIp(request), { windowMs: 60_000, maxRequests: 20, message: "AI rate limit exceeded. Max 20 requests/minute." });
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "OpenAI API key not configured" }, { status: 503 });
        }

        const body = (await request.json()) as any;
        const { proctoring_events = [], time_anomalies = [] } = body;

        const systemMsg = `You are an academic integrity AI analyst.
Analyze proctoring data and return a risk assessment as JSON:
{
  "risk_score": 0-100,
  "risk_level": "low" | "medium" | "high" | "critical",
  "flags": ["specific concern 1", "specific concern 2"],
  "recommendation": "concise action to take"
}`;

        const userMsg = `Exam ID: ${body.exam_id}
Proctoring events (${proctoring_events.length}):
${proctoring_events.map((e: any) => `- [${e.severity}] ${e.event_type} at ${e.created_at}`).join("\n") || "None"}
Time anomalies:
${time_anomalies.map((a: any) => `- ${a.description}`).join("\n") || "None"}`;

        const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.1,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemMsg },
              { role: "user",   content: userMsg   },
            ],
          }),
        });

        if (!oaiRes.ok) return Response.json({ error: "OpenAI request failed" }, { status: 502 });
        const data = await oaiRes.json();
        return Response.json(JSON.parse(data?.choices?.[0]?.message?.content ?? "{}"));
      },
    },
  },
});
