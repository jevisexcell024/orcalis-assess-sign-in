import "./lib/error-capture";
import { applySecurityHeaders } from "./lib/security-headers";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

const MISSING_SUPABASE_HINT = `# Fix: create a .env file in the project root

cp .env.example .env

Then fill in at minimum:

  VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
  VITE_SUPABASE_ANON_KEY=<your-anon-key>

Get these from: https://supabase.com/dashboard → your project → Settings → API

After saving .env, restart the dev server:

  npm run dev`;

function brandedErrorResponse(error?: unknown): Response {
  const message = errorMessage(error);
  const isMissingSupabase = message.includes("Missing Supabase environment variable");

  return new Response(
    renderErrorPage({
      reason: message || undefined,
      hint: isMissingSupabase ? MISSING_SUPABASE_HINT : undefined,
    }),
    {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  );
}

function errorMessage(error: unknown): string {
  if (!error) return "";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try { return JSON.stringify(error); } catch { return String(error); }
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  const captured = consumeLastCapturedError();
  console.error(captured ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse(captured);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      const ct = normalized.headers.get("content-type") ?? "";
      const skipHeaders =
        ct.startsWith("text/event-stream") ||
        ct.startsWith("application/octet-stream") ||
        ct.startsWith("image/");
      return skipHeaders ? normalized : applySecurityHeaders(normalized, request);
    } catch (error) {
      console.error(error);
      return applySecurityHeaders(brandedErrorResponse(error), request);
    }
  },
};
