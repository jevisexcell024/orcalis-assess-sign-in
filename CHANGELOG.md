# Changelog

All notable changes to Orcalis Assess are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project uses [Conventional Commits](https://www.conventionalcommits.org/).

---

## [Unreleased]

### Added — Session 2 (2026-06-01)

#### Database Migrations
- `students` table — full student profile with enrollment status, GPA, documents
- `academic_records` table — per-course grades, credit hours, GPA calculation
- `student_documents` table — ID cards, transcripts, admission letters
- `attendance_sessions` + `attendance_records` — QR/GPS/biometric/facial/manual methods
- `meal_sessions` + `meal_records` — exam catering management
- `results` table — full grading workflow: pending → auto_graded → approved → published
- `grading_rubrics`, `manual_grades`, `grade_scales`, `result_disputes`
- `auto_grade_attempt()` stored function
- `audit_logs` + `create_audit_log()` helper function
- `announcements`, `messages`, `notification_preferences`
- `integrity_checks` — plagiarism & AI detection
- `certificates` — with blockchain_hash and QR verification
- `mfa_configs`, `device_sessions` — security & 2FA
- Row Level Security policies on every new table

#### Admin Pages
- `/admin/candidates` — registration table with status/identity/score columns
- `/admin/results` — grading workflow dashboard with auto-grade indicator
- `/admin/attendance` — QR/GPS/biometric/facial tabs + session table
- `/admin/students` — Student Information System with GPA and enrollment status
- `/admin/audit-logs` — immutable action log with actor/IP/resource tracking
- `/admin/settings` — tabbed settings: General, Security, Notifications, Email, API Keys
- `/admin/violations` — live proctoring violations feed with severity filter
- `/admin/communication` — Announcement Center with Compose and Broadcast tabs
- `/admin/academic-integrity` — Plagiarism/AI detection dashboard with check-type breakdown
- `/admin/reports` — Report generator for 6 report types (CSV/XLSX/PDF)

#### Student Pages
- `/student/results` — full exam history with score bars, pass/fail badges, certificate download
- `/student/profile` — tabbed profile: Personal Info, Security/2FA, Notifications
- `/student/certificates` — digital certificate gallery with QR verification links
- `/student/attendance` — attendance history with rate bar and session records
- `/student/announcements` — announcements inbox + direct messages with read/unread state
- `/student/payments` — payment history, invoice list, saved card management

#### Public Pages
- `/verify/:certNumber` — public certificate verification portal (blockchain-anchored)

#### API Routes
- `GET /api/certificates/verify?cert=CERT-XXXXX` — public certificate verification
- `GET /api/results/export?format=csv&org_id=...` — result export endpoint
- `GET /api/attendance/qr?code=OA-XXXXXXXX` — validate QR attendance scan
- `POST /api/attendance/qr` — regenerate QR code for a session

#### Lib Modules
- `src/lib/students.ts` — student CRUD, GPA calculation
- `src/lib/attendance.ts` — session/record management, QR generation
- `src/lib/results.ts` — result workflow, grading, dispute submission
- `src/lib/certificates.ts` — issue, verify, revoke certificates
- `src/lib/communications.ts` — announcements, direct messages, unread count

#### Infrastructure
- `Dockerfile` — multi-stage build (bun builder → wrangler runner)
- `docker-compose.yml` — app + local Supabase stack
- `.github/workflows/ci.yml` — lint, typecheck, test, build, Trivy + gitleaks
- `.github/workflows/deploy.yml` — Cloudflare Pages production deploy
- `.env.example` — complete environment variable reference

---

## [0.1.0] — 2026-05-29

### Added — Session 1 (Initial Build)

#### Authentication
- Email/password sign-in and sign-up
- Admin login (separate portal)
- Forgot password + reset password flows
- Auth callback handling
- Session management via Supabase

#### Admin Portal
- Super Admin dashboard with live KPIs and AI interventions feed
- Exam builder (sections, questions: MCQ, true/false, descriptive, coding)
- Question bank with difficulty tagging
- Exam scheduler with schedule creation and registration management
- Live monitor with real-time proctoring event feed
- Analytics with charts (score distribution, pass rates, radar charts)
- Billing dashboard with revenue charts and plan management
- Certificate management with template builder
- Organization settings
- Team management with role assignment and invitations

#### Student Portal
- Student Hub with registered exams and performance chart
- Exam check-in with system compatibility check
- Live exam session with auto-save, timer, question navigation, and AI proctoring

#### Marketing Site
- Landing page with feature highlights and pricing teaser
- Features, Solutions, Pricing, About, Contact, Blog pages

#### Database
- `exams`, `exam_sections`, `questions` — exam and question management
- `exam_attempts`, `exam_answers` — attempt tracking
- `exam_registrations`, `exam_schedules` — scheduling and registration
- `organizations`, `organization_members`, `organization_invitations` — multi-tenancy
- `proctoring_events` — real-time violation logging
- `profiles`, `user_roles` — user management
- `get_exam_questions_for_attempt()`, `submit_exam_attempt()` stored functions
