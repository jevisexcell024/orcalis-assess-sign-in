## "Fix everything" is too broad to act on safely

The project is large — admin (exams, question bank, scheduler, live monitor, analytics, billing, certificates), student (check-in, dashboard), and auth (signup with email verification, sign-in, reset). Most surfaces are currently UI shells with mock data. "Make all functions work for production" could mean very different things, and each path is many hours of work.

Before I start changing things, I need you to point me at what actually matters. Pick one or more:

### A. Wire real data into existing screens
Replace mock data with Supabase reads/writes for these tables that already exist:
- `exams`, `exam_sections`, `questions` — power Admin → Exams, Question Bank, Exam Builder
- `exam_schedules`, `exam_registrations` — power Scheduler, Student check-in
- `proctoring_events` — power Live Monitor (with realtime)

### B. Lock down production auth & routing
- Convert `/dashboard`, `/admin/*`, `/student/*` to use the TanStack `_authenticated` layout guard instead of per-route session checks
- Add role-gating (super_admin / proctor / candidate) at the layout level
- Verify email-verification flow end to end

### C. Polish + fix obvious bugs only
- Run a build/typecheck pass, fix broken imports, dead links, route mismatches
- No new functionality, no data wiring

### D. Production hardening (cross-cutting)
- Error boundaries on every route with a loader
- SEO metadata on every page
- Security scan + RLS audit
- Empty/loading/error states on data screens

### My recommendation
Do **C + B first** (1 focused pass: fixes + auth hardening), then **A in slices** (one module at a time: Exams → Scheduler → Live Monitor). Trying to do A+B+C+D in one shot will produce a lot of half-working code and a giant unreviewable diff.

### What I need from you
Reply with one of:
- **"C+B"** — I do the focused fix + auth hardening pass now
- **"A: <module>"** — I wire real data for that specific module (Exams, Scheduler, Live Monitor, etc.)
- **"All of it, slice by slice"** — I do C+B now, then come back to you between each A slice
- **Something else** — tell me which specific things are broken or which features you actually need for launch
