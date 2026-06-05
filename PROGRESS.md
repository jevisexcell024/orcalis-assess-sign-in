# Orcalis Assess — Project Progress Log

## Project Overview
**Repo:** https://github.com/jevisexcell024/orcalis-assess-sign-in.git  
**Stack:** React + TypeScript + Vite + TanStack Router + Supabase + Tailwind CSS  
**Description:** A full-featured online assessment and proctoring platform for institutions. Includes admin dashboard, student portal, AI proctoring, exam scheduling, certificates, and more.

---

## Directory Structure (key paths)
```
src/
├── components/
│   ├── admin/AdminShell.tsx       # Admin sidebar + header shell
│   ├── auth/                      # Sign in, sign up, MFA forms
│   └── ui/                        # shadcn/ui component library
├── routes/
│   ├── admin.index.tsx            # Super Admin Dashboard
│   ├── admin.analytics.tsx        # Results & Analytics
│   ├── admin.attendance.tsx       # Attendance tracking
│   ├── admin.audit-logs.tsx       # Audit log viewer
│   ├── admin.billing.tsx          # Billing & Plans
│   ├── admin.candidates.tsx       # Candidate management
│   ├── admin.certificates.tsx     # Certificate designer
│   ├── admin.communication.tsx    # Announcements & messaging
│   ├── admin.exams.tsx            # Exam management
│   ├── admin.exams.$examId.builder.tsx  # Exam builder
│   ├── admin.live-monitor.tsx     # Live proctoring monitor
│   ├── admin.organization.tsx     # Org settings
│   ├── admin.question-bank.tsx    # Question repository
│   ├── admin.reports.tsx          # Reports
│   ├── admin.results.tsx          # Result management
│   ├── admin.scheduler.tsx        # Exam scheduler
│   ├── admin.settings.tsx         # Platform settings
│   ├── admin.students.tsx         # Student Information System
│   ├── admin.system-health.tsx    # ✅ NEW — System health monitor
│   ├── admin.team.tsx             # Team management
│   ├── admin.violations.tsx       # AI violation events
│   ├── student.index.tsx          # Student dashboard
│   └── student.*                  # Other student pages
├── lib/
│   ├── ai.ts                      # AI question generation
│   ├── auth.ts                    # Auth helpers
│   ├── certificates.ts            # Certificate logic
│   ├── communications.ts          # Announcement CRUD
│   ├── exams.ts                   # Exam + question CRUD
│   ├── scheduling.ts              # Schedules + dashboard overview
│   └── students.ts                # Student SIS CRUD
└── integrations/supabase/         # Supabase client + types
```

---

## Session Log

### Session 1 — Initial Build (pre-history)
- Full project scaffolded with TanStack Router, Supabase integration, all admin pages, student portal, API routes, and UI components.

### Session 2 — Production Readiness Audit
**Discovered:** 43+ dead buttons with no onClick handlers across the admin UI.

**Partial fixes applied before context limit hit** (unknown which files were completed in that session — files did not persist).

---

### Session 3 — Full Dead Button Fix (commit `ac3fe7c`, 2026-06-05)
**Commit:** `fix: wire all dead buttons and broken UI interactions`  
**Files changed:** 14 files, +581 / -232 lines

#### What was fixed:

| File | Fixes |
|------|-------|
| `AdminShell.tsx` | System Health nav link → `/admin/system-health` (was pointing to dashboard) |
| `admin.system-health.tsx` | **New file** — full system health page with 7 services, live latency, uptime, Run Check animation |
| `admin.index.tsx` | Chart range 24h/7d/30d selector, severity filter toggle, Review buttons, View All Events |
| `admin.settings.tsx` | Reveal/Hide API keys, Rotate keys, Generate New Key, Send Test Email with SMTP validation |
| `admin.question-bank.tsx` | Import button enabled, Prev/Next pagination (20/page, page count display) |
| `admin.certificates.tsx` | Asset tool selection, Design/Preview/Code tabs, zoom ±25%, Undo/Redo, Save Template, Generate Batch with loading state |
| `admin.analytics.tsx` | Export Report → toast, This/Last Semester toggle |
| `admin.candidates.tsx` | Export CSV, Register Candidate dialog (email + exam ID), Advanced filter, View per row |
| `admin.results.tsx` | Export, Review per row, Publish per row with per-attempt feedback |
| `admin.communication.tsx` | Send Message compose with validation, broadcast channel toggles, Send Broadcast with disabled guard |
| `admin.students.tsx` | Export, Enrol Student dialog, Profile/Transcript per row |
| `student.index.tsx` | Run Check — simulates system compatibility test with pass/fail toast |
| `routeTree.gen.ts` | Added `/admin/system-health` route |

---

## Known Remaining Issues / TODO

### Not yet addressed:
- [ ] `admin.exams.tsx` — check for dead buttons (not audited in session 3)
- [ ] `admin.exams.$examId.builder.tsx` — exam builder interactions
- [ ] `admin.live-monitor.tsx` — Intervene / Send Warning buttons are wired but open no modal; could add a confirmation dialog
- [ ] `admin.reports.tsx` — not audited
- [ ] `admin.billing.tsx` — not audited
- [ ] `admin.team.tsx` — not audited
- [ ] `admin.organization.tsx` — not audited
- [ ] `admin.audit-logs.tsx` — not audited
- [ ] `admin.scheduler.tsx` — not audited
- [ ] `admin.attendance.tsx` — not audited
- [ ] `admin.violations.tsx` — partially wired (severity filter + clear already worked)
- [ ] Real Supabase integration for: Register Candidate dialog, Enrol Student dialog (currently toast-only)
- [ ] Certificate designer — canvas is still visual-only (no real drag-and-drop editing)
- [ ] API keys — currently dummy values; should pull from Supabase secrets/vault
- [ ] Export CSV/PDF — currently toast-only; needs actual file generation
- [ ] Send Test Email — needs real SMTP call to backend API
- [ ] Import questions — CSV parsing not yet implemented

### Potential enhancements:
- [ ] Add real-time notification bell (currently shows a static red dot)
- [ ] Wire up global search bar in header
- [ ] Add student profile page with exam history and grade breakdown
- [ ] Certificate PDF export / download

---

## How to Resume This Project

1. Clone: `git clone https://github.com/jevisexcell024/orcalis-assess-sign-in.git`
2. Install: `npm install`
3. Run: `npm run dev`
4. Read this file (`PROGRESS.md`) to understand what's done and what's next

**Access token (for Claude sessions):** stored securely — ask Tamatey

---

## Tech Notes
- TypeScript errors in `src/routes/lovable/email/auth/webhook.ts` are **pre-existing** and not related to our work
- All new interactions use `toast` from `sonner` for feedback
- The `routeTree.gen.ts` is normally auto-generated by TanStack Router CLI — manual edits are required when adding routes without running the CLI
- Supabase project is connected via `src/integrations/supabase/client.ts`

