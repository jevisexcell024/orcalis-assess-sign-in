/**
 * Orcalis Assess — Migration Runner
 * Loads credentials from .env (reads file manually since ESM doesn't have dotenv by default)
 * Run: node scripts/migrate.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// Parse .env manually
function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) {
    console.error("ERROR: .env not found. Copy .env.example → .env and fill credentials.");
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL  = env.VITE_SUPABASE_URL;
const SERVICE_KEY   = env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF   = SUPABASE_URL?.replace("https://","").replace(".supabase.co","");
const MIGRATIONS_DIR = path.join(ROOT, "supabase/migrations");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("ERROR: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env");
  process.exit(1);
}

async function runSql(sql, label) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    console.log(`  ✓ ${label}`);
  } else {
    const msg = data?.message ?? "";
    if (/already exists|duplicate|does not exist/i.test(msg)) {
      console.log(`  ✓ ${label} (already applied)`);
    } else {
      console.warn(`  ⚠ ${label} — ${msg || `HTTP ${res.status}`}`);
    }
  }
}

async function main() {
  console.log("\n🚀 Orcalis Assess — Migration Runner");
  console.log("─".repeat(40));

  // Test connection
  console.log("\n1. Testing connection...");
  const test = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  }).catch(() => ({ ok: false, status: 0 }));
  if (!test.ok && test.status !== 400) {
    console.error(`  ✗ Failed (HTTP ${test.status})`); process.exit(1);
  }
  console.log(`  ✓ Connected`);

  // Migrations
  console.log("\n2. Applying migrations...");
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith(".sql")).sort();
  for (const f of files) {
    await runSql(fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8"), f);
  }

  // Realtime
  console.log("\n3. Enabling Realtime...");
  const tables = ["proctoring_events","exam_registrations","exam_attempts","announcements","messages"];
  for (const t of tables) {
    await runSql(
      `DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.${t}; EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `realtime on ${t}`
    );
  }

  console.log("\n✅ Done! Run: bun install && bun run dev\n");
}

main().catch(console.error);
