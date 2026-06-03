#!/usr/bin/env bash
# =============================================================
# Orcalis Assess — One-Shot Setup Script
# Loads credentials from .env — no secrets hardcoded here.
# Run: bash scripts/setup.sh
# =============================================================
set -e

# ── Load .env ────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env not found at $ENV_FILE"
  echo "  Copy .env.example → .env and fill in your credentials."
  exit 1
fi
set -o allexport; source "$ENV_FILE"; set +o allexport

SUPABASE_URL="${VITE_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
ANON_KEY="${VITE_SUPABASE_ANON_KEY}"
PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://||;s|\.supabase\.co||')
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
GITHUB_REPO="${GITHUB_REPO:-jevisexcell024/orcalis-assess-sign-in}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ] || [ -z "$ANON_KEY" ]; then
  echo "ERROR: Missing Supabase credentials in .env"
  echo "  Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓${NC} $1"; }
info() { echo -e "${YELLOW}  →${NC} $1"; }
fail() { echo -e "${RED}  ✗${NC} $1"; }
hdr()  { echo -e "\n${BOLD}$1${NC}\n────────────────────────────"; }

# ── 1. Connection test ───────────────────────────────────────
hdr "1 · Supabase Connection"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  "${SUPABASE_URL}/rest/v1/" -H "apikey: ${ANON_KEY}")
if [[ "$HTTP" =~ ^(200|400|404)$ ]]; then
  ok "Connected (HTTP $HTTP)"
else
  fail "Connection failed (HTTP $HTTP)"; exit 1
fi

# ── 2. Migrations ────────────────────────────────────────────
hdr "2 · Database Migrations"
MIGRATION_DIR="${SCRIPT_DIR}/../supabase/migrations"

run_sql() {
  local sql="$1" label="$2"
  local encoded=$(python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))" <<< "$sql")
  local http=$(curl -s -o /tmp/oa_mig.json -w "%{http_code}" --max-time 30 \
    "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\":${encoded}}")
  local msg=$(python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('message',''))" < /tmp/oa_mig.json 2>/dev/null || echo "")
  if [[ "$http" =~ ^(200|201|204)$ ]] || echo "$msg" | grep -qi "already exists\|duplicate\|does not exist"; then
    ok "$label"
  else
    fail "$label — ${msg:-HTTP $http}"
  fi
}

for f in $(ls "${MIGRATION_DIR}"/*.sql 2>/dev/null | sort); do
  run_sql "$(cat "$f")" "$(basename "$f")"
done

# ── 3. Realtime ──────────────────────────────────────────────
hdr "3 · Enable Realtime"
run_sql "
DO \$\$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.proctoring_events;  EXCEPTION WHEN duplicate_object THEN NULL; END \$\$;
DO \$\$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_registrations;  EXCEPTION WHEN duplicate_object THEN NULL; END \$\$;
DO \$\$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_attempts;        EXCEPTION WHEN duplicate_object THEN NULL; END \$\$;
DO \$\$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;        EXCEPTION WHEN duplicate_object THEN NULL; END \$\$;
DO \$\$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;             EXCEPTION WHEN duplicate_object THEN NULL; END \$\$;
" "Realtime publications"

# ── 4. GitHub Secrets (optional) ────────────────────────────
if [ -n "$GITHUB_TOKEN" ]; then
  hdr "4 · GitHub Secrets"
  KEY_DATA=$(curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/${GITHUB_REPO}/actions/secrets/public-key")
  KEY_ID=$(echo "$KEY_DATA" | python3 -c "import json,sys; print(json.load(sys.stdin)['key_id'])" 2>/dev/null)
  PUB_KEY=$(echo "$KEY_DATA" | python3 -c "import json,sys; print(json.load(sys.stdin)['key'])" 2>/dev/null)

  set_secret() {
    local name="$1" value="$2"
    [[ -z "$value" ]] && return
    local enc=$(python3 -c "
from nacl import encoding, public as p; import base64
pk = p.PublicKey('${PUB_KEY}'.encode(), encoding.Base64Encoder)
print(base64.b64encode(p.SealedBox(pk).encrypt('${value}'.encode())).decode())
" 2>/dev/null)
    [[ -z "$enc" ]] && { info "$name — install PyNaCl: pip install PyNaCl"; return; }
    local h=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
      -H "Authorization: token ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github.v3+json" \
      "https://api.github.com/repos/${GITHUB_REPO}/actions/secrets/${name}" \
      -d "{\"encrypted_value\":\"${enc}\",\"key_id\":\"${KEY_ID}\"}")
    [[ "$h" =~ ^(201|204)$ ]] && ok "$name" || fail "$name (HTTP $h)"
  }
  set_secret "VITE_SUPABASE_URL"      "$SUPABASE_URL"
  set_secret "VITE_SUPABASE_ANON_KEY" "$ANON_KEY"
else
  hdr "4 · GitHub Secrets"
  info "Set GITHUB_TOKEN=your_pat in .env to auto-set secrets, or add them manually."
fi

hdr "Done"
echo -e "${GREEN}${BOLD}Setup complete!${NC}"
echo -e "\n  Run:  bun install && bun run dev"
echo -e "  Open: http://localhost:5173\n"
