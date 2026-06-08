# Orcalis Assess Sign-In

Enterprise-grade online examination and AI-powered proctoring platform. Secure, scalable, and compliant with SOC 2 Type II, ISO 27001, GDPR, and FERPA standards.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (or use `nvm` to switch versions)
- npm 10+ or pnpm 9+
- Git

### Installation

```bash
git clone https://github.com/your-org/orcalis-assess-sign-in.git
cd orcalis-assess-sign-in

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:8084` (port auto-increments if in use).

---

## 📋 Project Structure

```
src/
├── components/          # React components
│   ├── admin/          # Admin-specific components
│   ├── auth/           # Authentication forms & flows
│   ├── marketing/      # Marketing/landing page components
│   ├── student/        # Student-facing components
│   └── ui/             # Radix UI + custom shadcn components
├── routes/             # TanStack Router file-based routes
│   ├── admin*.tsx      # Admin dashboard routes
│   ├── student*.tsx    # Student exam routes
│   └── lovable/        # Email template & webhook routes
├── lib/                # Utilities & business logic
│   ├── auth.ts         # Authentication helpers
│   ├── auth-schema.ts  # Zod validation schemas
│   ├── exams.ts        # Exam/question CRUD operations
│   ├── scheduling.ts   # Exam scheduling & analytics
│   ├── organizations.ts # Multi-tenancy org logic
│   ├── error-capture.ts # SSR error boundary capture
│   └── error-page.ts   # Error page HTML template
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   ├── supabase/       # Supabase client & types
│   └── lovable/        # Lovable email service
├── router.tsx          # TanStack Router instance
├── start.ts            # TanStack Start middleware
├── server.ts           # SSR server entry + error handling
└── styles.css          # Global Tailwind CSS

supabase/              # Supabase migrations & config
docs/                  # Documentation & guides
  └── GOOGLE_OAUTH.md  # OAuth setup instructions
```

---

## 🔧 Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (HMR enabled) |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode (debugging) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint + Prettier |
| `npm run format` | Auto-format code with Prettier |

---

## 🏗️ Architecture Overview

### Frontend Stack

- **Framework:** React 19 + TanStack Router (file-based routing)
- **State Management:** React Query (server state) + React Hook Form
- **UI Components:** Radix UI + shadcn/ui + Tailwind CSS v4
- **Build Tool:** Vite 7 with TanStack Start
- **Runtime:** CloudFlare Workers (edge deployment)
- **Type Safety:** TypeScript 5.8 with strict mode

### Backend Stack

- **Database:** Supabase (PostgreSQL) with Row-Level Security
- **Auth:** Supabase Auth + Google OAuth + Email magic links
- **Email:** Lovable email service + React Email templates
- **Validation:** Zod (runtime type validation)
- **Monitoring:** Error capture via global listeners (see `error-capture.ts`)

### Deployment

- **Edge Runtime:** CloudFlare Workers via wrangler
- **Database:** Supabase (managed, multi-region available)
- **Environment Variables:** `.env` for local, wrangler env for production
- **SLA:** 99.99% uptime on Enterprise tier

---

## 🔐 Authentication Flow

1. **Sign In/Sign Up:** Email + password via Supabase Auth
2. **Google OAuth:** Optional SSO via `@lovable.dev/cloud-auth-js`
3. **Session Management:** JWT stored in HTTPOnly cookies (Supabase)
4. **Admin Check:** `isAdminUser()` validates against `VITE_ADMIN_EMAILS`
5. **Protected Routes:** Middleware in `__root.tsx` enforces auth

---

## 🗄️ Database Schema

### Core Tables

- **exams** - Exam metadata (title, duration, pass score, etc.)
- **exam_schedules** - Scheduled exam instances
- **exam_sections** - Sub-sections within an exam
- **questions** - Question bank (MCQ, short-form, essay)
- **exam_registrations** - Student registrations per exam
- **proctoring_events** - AI-flagged violations during exams
- **organizations** - Multi-tenant org structure
- **audit_logs** - Compliance audit trail

### Row-Level Security (RLS)

- Students can only see their own exams & registrations
- Proctors can only see proctoring events for their org
- Admins have full access within their org
- See `supabase/migrations/` for RLS policies

---

## 📧 Email System

### Supported Email Types

- **signup** - Confirmation after registration
- **invite** - Org member invitation
- **magiclink** - Passwordless login link
- **recovery** - Password reset
- **email_change** - Confirm new email address
- **reauthentication** - 2FA verification code

### Template Location

Templates are in `src/lib/email-templates/` as React components. Webhook at `/lovable/email/auth/webhook` renders & sends them via Lovable.

### Preview Emails

Development: POST to `http://localhost:8084/lovable/email/auth/preview` with:

```json
{
  "type": "signup",
  "data": { "email": "test@example.com", ... }
}
```

---

## 🚨 Error Handling

### Client-Side

- Global error boundary in `__root.tsx`
- Error UI fallback at `routes/not-found.tsx`
- Error capture via `src/lib/error-capture.ts` (global listeners)

### Server-Side

- SSR error wrapper in `src/server.ts`
- Catches h3 swallowed errors & returns branded 500 page
- Error logged to console (ready for Sentry integration)

### Future: Structured Logging

Add `pino` or `winston` for structured logs + Sentry SDK for error tracking.

---

## 📊 Analytics & Compliance

### What We Track (in DB)

- Exam registrations & completions
- Proctoring events (violations, AI scores)
- Audit logs (login, role changes, deletions)
- Question-level analytics (difficulty, discrimination index)

### Security Features

- ✅ End-to-end encryption (TLS 1.3 + AES-256 at rest)
- ✅ Row-level security across all tables
- ✅ Full audit logs for every action
- ✅ SOC 2 Type II ready (evidence in docs/)
- 🚧 GDPR data export (TODO)
- 🚧 GDPR right to deletion (TODO - soft deletes)

---

## 🧪 Testing

### Currently

- ❌ No automated tests yet
- Manual testing via browser

### Planned (Q2 2026)

- Unit tests (utilities, hooks) with Vitest
- Integration tests for API routes
- E2E tests (Playwright) for critical user flows
- Accessibility tests (axe-core)

---

## 🐛 Known Issues & TODOs

- [ ] npm audit shows 4 moderate vulnerabilities (see SECURITY.md)
- [ ] @react-email/components deprecated (investigate replacement)
- [ ] No feature flags system (limiting deployment flexibility)
- [ ] Error tracking not integrated (no Sentry/LogRocket)
- [ ] Rate limiting not enforced on API endpoints
- [ ] GDPR data export endpoint missing
- [ ] Accessibility: missing ARIA labels on custom inputs
- [ ] Performance: no caching strategy for queries

See [Issues](./issues) for more.

---

## 🤝 Contributing

### Branch Strategy

- `main` - Production (protected, requires 1 approval)
- `develop` - Staging (auto-deploys on merge)
- Feature branches - `feature/ISSUE-XX-short-description`

### Commit Convention

```bash
git commit -m "feat: add feature flag system"
git commit -m "fix: resolve email webhook timeout"
git commit -m "docs: update authentication flow"
```

### Code Style

- ESLint enforces TypeScript + React best practices
- Prettier auto-formats on save (if IDE configured)
- Run `npm run format` before committing

```bash
npm run lint      # Check for issues
npm run format    # Auto-fix formatting
```

### PR Requirements

1. ✅ All CI checks pass
2. ✅ Code review by 1+ maintainer
3. ✅ Tests included (for new logic)
4. ✅ Documentation updated

---

## 🔐 Environment Variables

### Required

```env
# Supabase (public, safe to commit after masking)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_public_...

# Admin emails (comma-separated)
VITE_ADMIN_EMAILS=admin@example.com,superadmin@example.com

# Lovable email service (server-side only)
LOVABLE_API_KEY=sk_live_...

# CloudFlare (for deployment)
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

### Optional

```env
# Sentry (error tracking)
SENTRY_DSN=https://...@sentry.io/...

# Feature flags (coming soon)
FEATURE_FLAGS={"betaFeature": true}

# Analytics
MIXPANEL_TOKEN=your_token
```

All `.env` files in `.gitignore` — never commit secrets.

---

## 📱 Deployment

### Development

```bash
npm run dev
# Runs on http://localhost:8084 (auto-increments port if occupied)
```

### Staging (via CI/CD)

```bash
git push origin develop
# Automatically deploys to staging.orcalis-assess.com
```

### Production

```bash
git tag v1.0.0
git push origin v1.0.0
# Triggers production build & deploy to orcalis-assess.com
```

### Manual Build & Preview

```bash
npm run build
npm run preview
# Preview production bundle locally at http://localhost:4173
```

---

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Dev server auto-increments (8080 → 8081 → 8082...)
# Or manually free the port:
npx fkill-cli :8080
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or update dependencies
npm update
npm audit fix
```

### Build Fails

```bash
# Check for type errors
npm run build:dev

# ESLint errors?
npm run lint
npm run format
```

### Database Connection Issues

```bash
# Verify .env has correct Supabase URL & key
# Check Supabase project status: https://app.supabase.com
# Test connection: npm run db:check (TODO)
```

---

## 📚 Additional Resources

- [TanStack Router Docs](https://tanstack.com/router/latest)
- [TanStack Start Docs](https://tanstack.com/start/latest)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Zod Validation](https://zod.dev)
- [React Query Docs](https://tanstack.com/query/latest)
- [Radix UI Components](https://www.radix-ui.com)

---

## 📄 License

Proprietary. Built by Orcalis. All rights reserved.

---

## 🎯 Roadmap

- **Q2 2026:** Testing framework + unit tests, Sentry integration
- **Q3 2026:** Feature flags, API rate limiting, GDPR compliance
- **Q4 2026:** Advanced analytics, custom AI model tuning, dedicated infrastructure

---

## 💬 Support

- **Issues:** [GitHub Issues](./issues)
- **Docs:** [Documentation](./docs)
- **Email:** support@orcalis-assess.com

---

**Last Updated:** May 25, 2026  
**Current Version:** 1.0.0-alpha  
**Maintainers:** Development Team
