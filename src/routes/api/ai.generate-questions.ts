import { createFileRoute } from "@tanstack/react-router";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `You are an expert academic assessment designer for an enterprise examination platform.
Generate high-quality exam questions based on the topic and parameters provided.
Always return valid JSON matching the specified schema exactly.
Questions must be academically rigorous, unambiguous, and appropriate for the difficulty level.`;

function buildPrompt(input: {
  topic: string;
  subject?: string;
  difficulty?: string;
  count?: number;
  types?: string[];
  context?: string;
}): string {
  const count   = input.count ?? 5;
  const diff    = input.difficulty ?? "medium";
  const types   = input.types?.length ? input.types.join(", ") : "mcq, true_false";

  return `Generate ${count} exam questions on the topic: "${input.topic}".
${input.subject ? `Subject area: ${input.subject}` : ""}
${input.context  ? `Curriculum context: ${input.context}` : ""}
Difficulty level: ${diff}
Question types to include (mix if multiple): ${types}

Return a JSON object with this exact shape:
{
  "questions": [
    {
      "type": "mcq" | "true_false" | "descriptive" | "coding",
      "prompt": "Question text here",
      "difficulty": "${diff}",
      "points": 1 to 10 (appropriate for type),
      "options": [                          // only for mcq/true_false
        { "text": "Option A", "is_correct": false },
        { "text": "Option B", "is_correct": true },
        ...
      ],
      "explanation": "Why the correct answer is correct",
      "tags": ["tag1", "tag2"],
      "subject": "${input.subject ?? ""}"
    }
  ]
}

Rules:
- MCQ must have exactly 4 options with exactly 1 correct
- true_false must have exactly 2 options: "True" and "False"
- descriptive and coding have no options array
- All prompts must be clear and self-contained
- No duplicate questions`;
}

export const Route = createFileRoute("/api/ai/generate-questions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await checkRateLimit(getClientIp(request), { windowMs: 60_000, maxRequests: 20, message: "AI rate limit exceeded. Max 20 requests/minute." });
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "OpenAI API key not configured. Set OPENAI_API_KEY in your environment." },
            { status: 503 },
          );
        }

        const body = await request.json().catch(() => ({}));

        const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user",   content: buildPrompt(body as any) },
            ],
          }),
        });

        if (!oaiRes.ok) {
          const err = await oaiRes.json().catch(() => ({}));
          return Response.json(
            { error: (err as any)?.error?.message ?? "OpenAI request failed" },
            { status: 502 },
          );
        }

        const oaiData = await oaiRes.json();
        const content = oaiData?.choices?.[0]?.message?.content ?? "{}";

        let parsed: any;
        try {
          parsed = JSON.parse(content);
        } catch {
          return Response.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        return Response.json({ questions: parsed.questions ?? [] });
      },
    },
  },
});
