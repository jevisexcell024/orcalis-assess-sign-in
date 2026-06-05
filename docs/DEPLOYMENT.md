# Orcalis Assess — Production Deployment Guide

## Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) v4+
- Cloudflare account with Workers enabled
- Supabase project (free tier or above)

---

## 1. Required Secrets

Set every secret with `wrangler secret put <NAME>`. Never commit values to source control.

| Secret | Where to get it | Required |
|--------|----------------|----------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key | ✅ |
| `OPENAI_API_KEY` | platform.openai.com → API keys | ✅ (AI features) |
| `RESEND_API_KEY` | resend.com → API Keys | ✅ (email) |
| `INTERNAL_API_KEY` | `openssl rand -hex 32` | ✅ (webhooks) |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → Developers → API keys | ⚠️ (payments) |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen --print-secret` | ⚠️ (payments) |
| `VITE_SENTRY_DSN` | sentry.io → Project → Settings → Client Keys | ℹ️ (monitoring) |

### Bulk setup script

```bash
# Run from project root after filling in values:
wrangler secret put VITE_SUPABASE_URL
wrangler secret put VITE_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put INTERNAL_API_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put VITE_SENTRY_DSN
```

---

## 2. Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-ref>

# Run all migrations
supabase db push

# Verify RLS is active
supabase db remote list
```

---

## 3. Deploy to Cloudflare Workers

```bash
# Install dependencies
npm install

# Build + deploy
npm run deploy
# or: wrangler deploy
```

---

## 4. GitHub Actions CI/CD

Add the following as **repository secrets** (Settings → Secrets → Actions):

```
CLOUDFLARE_API_TOKEN      — Cloudflare API token with Workers:Edit permission
CLOUDFLARE_ACCOUNT_ID     — Your Cloudflare account ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
RESEND_API_KEY
INTERNAL_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
VITE_SENTRY_DSN
SENTRY_AUTH_TOKEN
```

The CI pipeline (`.github/workflows/`) will:
1. Run TypeScript type-check (`tsc --noEmit`)
2. Run security scans (Trivy + Gitleaks)
3. Deploy to Cloudflare Workers on push to `main`

---

## 5. Post-deploy checklist

- [ ] Visit `/api/health` — should return `{"status":"ok"}`
- [ ] Visit `/api/version` — should return build version
- [ ] Sign in as super_admin and visit `/admin`
- [ ] Send a test email from Admin → Settings → Email Configuration
- [ ] Confirm Stripe webhook endpoint is registered for `/api/payments/webhook`
- [ ] Confirm Supabase auth redirect URLs include your production domain

---

## 6. Security notes

- `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS — **never expose client-side**
- Rotate `INTERNAL_API_KEY` if you suspect it was exposed
- The `.env` file is git-ignored; never commit it
- All Supabase tables have RLS enabled — see `supabase/migrations/`
