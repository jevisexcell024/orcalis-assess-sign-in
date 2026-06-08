import { createFileRoute } from "@tanstack/react-router";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const Route = createFileRoute("/api/ai/grade-answer")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await checkRateLimit(getClientIp(request), { windowMs: 60_000, maxRequests: 20, message: "AI rate limit exceeded. Max 20 requests/minute." });
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "OpenAI API key not configured" }, { status: 503 });
        }

        const { question_prompt, student_answer, rubric, max_points } =
          (await request.json()) as any;

        const systemMsg = `You are a fair and rigorous academic grader.
Grade the student's answer objectively based on the question and rubric.
Return JSON: { "points_awarded": number, "feedback": string, "reasoning": string }
points_awarded must be between 0 and max_points (inclusive).
feedback should be constructive and specific.`;

        const userMsg = `Question: ${question_prompt}
Max points: ${max_points}
${rubric ? `Grading rubric:\n${rubric}` : ""}
Student answer: ${student_answer}`;

        const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemMsg },
              { role: "user",   content: userMsg   },
            ],
          }),
        });

        if (!oaiRes.ok) return Response.json({ error: "OpenAI request failed" }, { status: 502 });

        const data = await oaiRes.json();
        const content = data?.choices?.[0]?.message?.content ?? "{}";
        const result = JSON.parse(content);

        // Clamp points to valid range
        result.points_awarded = Math.min(
          max_points,
          Math.max(0, Number(result.points_awarded ?? 0)),
        );

        return Response.json(result);
      },
    },
  },
});
