import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ChevronRight, ChevronLeft, Check, AlertTriangle, Info,
  Sparkles, X, Plus, Trash2, GripVertical, Clock, Shield,
  Users, BookOpen, Settings, Eye, Send, Zap, Lock,
  MonitorSmartphone, Cpu, FileText, Calendar, Target,
  RotateCcw, CheckCircle2, XCircle, Loader2, Save,
  Bold, Italic, List, Link, Image, Paperclip,
  Smartphone, Accessibility, ChevronDown, ChevronUp,
  BarChart2, Hash, Tag, Layers, Award, Globe,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/exams/new")({
  component: ExamWizardPage,
  head: () => ({ meta: [{ title: "Create Examination · Orcalis Assess" }] }),
});

const NAVY = "oklch(0.385 0.12 247)";
const STORAGE_KEY = "orcalis_exam_wizard_v2";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GradeBoundary { label: string; min: number; max: number; }
interface ExamSection {
  id: string; title: string; type: string;
  questionCount: number; marks: number; mandatory: boolean;
  optionalCount: number; timeLimitMinutes: number | null;
}
interface WizardState {
  // Step 1 – Examination Information
  title: string; code: string; description: string;
  academicYear: string; semester: string; faculty: string;
  department: string; program: string; course: string; subject: string;
  category: string; examMode: string;
  // Step 2 – Candidate Assignment
  assignmentMethod: string; filterValue: string;
  // Step 3 – Examination Structure
  sections: ExamSection[];
  // Step 4 – Question Selection
  questionSources: string[]; questionTypes: string[];
  totalQuestions: number; difficultyEasy: number; difficultyMedium: number; difficultyHard: number;
  randomizeQuestions: boolean; shuffleAnswers: boolean; candidateSets: boolean;
  filterTopic: string; filterTags: string; filterOutcomes: string;
  // Step 5 – Marking Configuration
  marksPerQuestion: number; negativeMarking: boolean; negativeValue: number;
  bonusMarks: boolean; partialCredit: boolean;
  gradingSystem: string; gradeBoundaries: GradeBoundary[];
  // Step 6 – Examination Schedule
  examDate: string; startTime: string; endTime: string; duration: number;
  windowType: string; autoSubmit: boolean; gracePeriod: number; latePolicy: string;
  // Step 7 – Security Configuration
  secFullscreen: boolean; secDisableCopy: boolean; secDisablePaste: boolean;
  secDisablePrint: boolean; secDisableScreenshot: boolean; secDisableRightClick: boolean; secDisableDevTools: boolean;
  authStudentLogin: boolean; authExamPassword: boolean; authExamPin: boolean; auth2FA: boolean;
  procWebcam: boolean; procMic: boolean; procScreen: boolean; procAI: boolean; procFacial: boolean;
  detectTabSwitch: boolean; detectMultiFace: boolean; detectMultiScreen: boolean;
  detectUnauthorized: boolean; detectNetwork: boolean;
  // Step 8 – Examination Instructions
  generalInstructions: string; examRules: string;
  allowedMaterials: string; prohibitedActivities: string; technicalRequirements: string;
  // Step 9 – Accessibility
  extraTime: boolean; extraTimeMinutes: number;
  largeText: boolean; highContrast: boolean; screenReader: boolean;
  // Step 12 – Publish
  publishOption: string;
}

const DEFAULT_BOUNDARIES: GradeBoundary[] = [
  { label: "A", min: 80, max: 100 },
  { label: "B", min: 70, max: 79 },
  { label: "C", min: 60, max: 69 },
  { label: "D", min: 50, max: 59 },
  { label: "F", min: 0,  max: 49 },
];

const INITIAL: WizardState = {
  title: "", code: "", description: "", academicYear: "", semester: "",
  faculty: "", department: "", program: "", course: "", subject: "",
  category: "", examMode: "online",
  assignmentMethod: "department", filterValue: "",
  sections: [{ id: crypto.randomUUID(), title: "Section A", type: "mcq", questionCount: 40, marks: 40, mandatory: true, optionalCount: 0, timeLimitMinutes: null }],
  questionSources: ["bank"], questionTypes: ["mcq"],
  totalQuestions: 40, difficultyEasy: 40, difficultyMedium: 40, difficultyHard: 20,
  randomizeQuestions: true, shuffleAnswers: true, candidateSets: false,
  filterTopic: "", filterTags: "", filterOutcomes: "",
  marksPerQuestion: 1, negativeMarking: false, negativeValue: 0.25,
  bonusMarks: false, partialCredit: false,
  gradingSystem: "percentage", gradeBoundaries: DEFAULT_BOUNDARIES,
  examDate: "", startTime: "", endTime: "", duration: 60,
  windowType: "fixed", autoSubmit: true, gracePeriod: 5, latePolicy: "disallow",
  secFullscreen: true, secDisableCopy: true, secDisablePaste: true,
  secDisablePrint: true, secDisableScreenshot: true, secDisableRightClick: true, secDisableDevTools: true,
  authStudentLogin: true, authExamPassword: false, authExamPin: false, auth2FA: false,
  procWebcam: true, procMic: false, procScreen: false, procAI: false, procFacial: false,
  detectTabSwitch: true, detectMultiFace: false, detectMultiScreen: true,
  detectUnauthorized: true, detectNetwork: true,
  generalInstructions: "", examRules: "", allowedMaterials: "",
  prohibitedActivities: "", technicalRequirements: "",
  extraTime: false, extraTimeMinutes: 30, largeText: false, highContrast: false, screenReader: false,
  publishOption: "draft",
};

// ─── Steps ───────────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1,  label: "Exam Information",   icon: FileText },
  { num: 2,  label: "Candidate Assignment", icon: Users },
  { num: 3,  label: "Exam Structure",    icon: LayersIcon },
  { num: 4,  label: "Question Selection", icon: BookOpen },
  { num: 5,  label: "Marking Config",    icon: Target },
  { num: 6,  label: "Schedule",          icon: Calendar },
  { num: 7,  label: "Security",          icon: Shield },
  { num: 8,  label: "Instructions",      icon: FileText },
  { num: 9,  label: "Accessibility",     icon: Accessibility },
  { num: 10, label: "Review",            icon: CheckCircle2 },
  { num: 11, label: "Preview",           icon: Eye },
  { num: 12, label: "Publish",           icon: Send },
];

function LayersIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m16.02 12 5.48 3.13a1 1 0 0 1 0 1.74L13 21a2 2 0 0 1-2 0L2.5 16.87a1 1 0 0 1 0-1.74L8 12" />
      <path d="M13 13a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 3a2 2 0 0 1 2 0l8.5 4.13a1 1 0 0 1 0 1.74Z" />
    </svg>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", checked ? "bg-[oklch(0.385_0.12_247)]" : "bg-muted")}
    >
      <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow transition-transform", checked ? "translate-x-4" : "translate-x-0.5")} />
    </button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition", active ? "border-transparent text-white" : "border-border bg-background text-muted-foreground hover:text-foreground")}
      style={active ? { background: NAVY } : undefined}
    >{label}</button>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-background p-5 shadow-sm", className)}>{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const categories = [
    "Quiz", "Assignment", "Continuous Assessment", "Mid-Semester Examination",
    "End-of-Semester Examination", "Entrance Examination", "Certification Examination",
    "Mock Examination", "Practice Test",
  ];
  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Basic Details</SectionTitle>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Examination Title <span className="text-rose-500">*</span></Label>
              <Input value={s.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. CS101 Final Examination" />
            </div>
            <div className="space-y-1.5">
              <Label>Examination Code <span className="text-rose-500">*</span></Label>
              <Input value={s.code} onChange={(e) => set({ code: e.target.value })} placeholder="e.g. CS101-F2026" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea value={s.description} onChange={(e) => set({ description: e.target.value })} rows={2} placeholder="Brief description of this examination…" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { key: "academicYear", label: "Academic Year *", placeholder: "2025/2026" },
              { key: "faculty",      label: "Faculty",          placeholder: "Engineering" },
              { key: "department",   label: "Department",       placeholder: "Computer Science" },
              { key: "program",      label: "Program",          placeholder: "B.Sc. CS" },
            ].map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                <Input value={(s as any)[f.key]} onChange={(e) => set({ [f.key]: e.target.value } as any)} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Semester <span className="text-rose-500">*</span></Label>
              <select value={s.semester} onChange={(e) => set({ semester: e.target.value })} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
                <option value="">Select…</option>
                {["First Semester", "Second Semester", "Summer Session", "Full Year"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            {[
              { key: "course",   label: "Course",   placeholder: "Data Structures" },
              { key: "subject",  label: "Subject",  placeholder: "Algorithms" },
            ].map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                <Input value={(s as any)[f.key]} onChange={(e) => set({ [f.key]: e.target.value } as any)} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Examination Category</SectionTitle>
        <select value={s.category} onChange={(e) => set({ category: e.target.value })} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
          <option value="">Select category…</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Card>

      <Card>
        <SectionTitle>Examination Mode</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "online",   label: "Online",   icon: Globe,            desc: "Fully online proctored exam" },
            { id: "physical", label: "Physical", icon: FileText,          desc: "On-site physical examination" },
            { id: "hybrid",   label: "Hybrid",   icon: MonitorSmartphone, desc: "Combined online and on-site" },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.id} type="button" onClick={() => set({ examMode: m.id })}
                className={cn("flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition", s.examMode === m.id ? "border-[oklch(0.385_0.12_247)] bg-blue-50/30" : "border-border hover:border-foreground/30")}
              >
                <Icon className={cn("h-6 w-6", s.examMode === m.id ? "text-[oklch(0.385_0.12_247)]" : "text-muted-foreground")} />
                <span className="text-sm font-semibold">{m.label}</span>
                <span className="text-xs text-muted-foreground">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const methods = [
    { id: "institution", label: "Entire Institution",  desc: "All enrolled candidates" },
    { id: "faculty",     label: "Faculty",             desc: "Filter by faculty" },
    { id: "department",  label: "Department",          desc: "Filter by department" },
    { id: "program",     label: "Program",             desc: "Filter by program" },
    { id: "course",      label: "Course",              desc: "Specific course enrolees" },
    { id: "class",       label: "Class",               desc: "Specific class group" },
    { id: "individual",  label: "Individual Students", desc: "Manual candidate selection" },
  ];
  const needsFilter = ["faculty","department","program","course","class"].includes(s.assignmentMethod);
  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Assignment Method</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {methods.map((m) => (
            <button key={m.id} type="button" onClick={() => set({ assignmentMethod: m.id })}
              className={cn("rounded-xl border-2 p-3 text-left transition", s.assignmentMethod === m.id ? "border-[oklch(0.385_0.12_247)] bg-blue-50/30" : "border-border hover:border-foreground/30")}
            >
              <p className={cn("text-sm font-medium", s.assignmentMethod === m.id ? "text-[oklch(0.385_0.12_247)]" : "")}>{m.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{m.desc}</p>
            </button>
          ))}
        </div>
        {needsFilter && (
          <div className="mt-4 space-y-1.5">
            <Label className="text-xs">Filter value</Label>
            <Input value={s.filterValue} onChange={(e) => set({ filterValue: e.target.value })} placeholder={`Enter ${s.assignmentMethod} name…`} />
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Candidate Management</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {["Search Students", "Bulk Selection", "Bulk Upload", "Manual Assignment", "Dynamic Enrollment"].map((c) => (
            <div key={c} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
              <p className="text-xs font-semibold">{c}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Assigned",   value: "—", color: "text-foreground" },
          { label: "Eligible",         value: "—", color: "text-emerald-700" },
          { label: "Restricted",       value: "—", color: "text-rose-700" },
        ].map((c) => (
          <Card key={c.label} className="text-center">
            <p className={cn("text-3xl font-bold", c.color)}>{c.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.label}</p>
            <p className="text-[10px] text-muted-foreground">Populated after sync</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function Step3({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const qTypes = ["mcq","true_false","short_answer","essay","coding","numerical","file_upload"];
  const fmt = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const addSection = () => set({
    sections: [...s.sections, { id: crypto.randomUUID(), title: `Section ${String.fromCharCode(65 + s.sections.length)}`, type: "mcq", questionCount: 10, marks: 10, mandatory: true, optionalCount: 0, timeLimitMinutes: null }],
  });

  const update = (id: string, patch: Partial<ExamSection>) =>
    set({ sections: s.sections.map((sec) => sec.id === id ? { ...sec, ...patch } : sec) });

  const remove = (id: string) => set({ sections: s.sections.filter((sec) => sec.id !== id) });

  const totalMarks = s.sections.reduce((a, sec) => a + sec.marks, 0);
  const totalQ = s.sections.reduce((a, sec) => a + sec.questionCount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Exam Sections</h3>
          <p className="text-sm text-muted-foreground">Total: {totalQ} questions · {totalMarks} marks</p>
        </div>
        <Button size="sm" onClick={addSection} className="gap-1.5 text-white" style={{ background: NAVY }}>
          <Plus className="h-4 w-4" /> Add Section
        </Button>
      </div>

      {s.sections.map((sec, i) => (
        <Card key={sec.id}>
          <div className="mb-4 flex items-center gap-3">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground shrink-0">
              Section {String.fromCharCode(65 + i)}
            </span>
            <Input value={sec.title} onChange={(e) => update(sec.id, { title: e.target.value })} className="h-8 text-sm font-semibold flex-1" />
            {s.sections.length > 1 && (
              <button onClick={() => remove(sec.id)} className="rounded-md p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Question Type</Label>
              <select value={sec.type} onChange={(e) => update(sec.id, { type: e.target.value })} className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs">
                {qTypes.map((t) => <option key={t} value={t}>{fmt(t)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">No. of Questions</Label>
              <Input type="number" min={1} value={sec.questionCount} onChange={(e) => update(sec.id, { questionCount: +e.target.value })} className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Total Marks</Label>
              <Input type="number" min={0} value={sec.marks} onChange={(e) => update(sec.id, { marks: +e.target.value })} className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Section Duration (min)</Label>
              <Input type="number" min={0} value={sec.timeLimitMinutes ?? ""} placeholder="No limit" onChange={(e) => update(sec.id, { timeLimitMinutes: e.target.value ? +e.target.value : null })} className="h-8 text-xs" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Mandatory Questions</Label>
              <Input type="number" min={0} max={sec.questionCount} value={sec.questionCount - sec.optionalCount} readOnly className="h-8 text-xs bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Optional Questions</Label>
              <Input type="number" min={0} max={sec.questionCount} value={sec.optionalCount} onChange={(e) => update(sec.id, { optionalCount: Math.min(+e.target.value, sec.questionCount) })} className="h-8 text-xs" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-xs">
                <Toggle checked={sec.mandatory} onChange={(v) => update(sec.id, { mandatory: v })} />
                Section mandatory
              </label>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────

function Step4({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const toggle = (arr: string[], val: string) => arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
  const diffTotal = s.difficultyEasy + s.difficultyMedium + s.difficultyHard;

  const sources = [
    { id: "bank",   label: "Question Bank",      desc: "From existing questions" },
    { id: "manual", label: "Manual Creation",    desc: "Write from scratch" },
    { id: "ai",     label: "AI Generated",       desc: "Generate with AI" },
    { id: "import", label: "Imported Questions", desc: "Import from file" },
  ];
  const qTypes = [
    { id: "mcq",          label: "Multiple Choice"   },
    { id: "multi_resp",   label: "Multiple Response" },
    { id: "true_false",   label: "True / False"      },
    { id: "fill_blank",   label: "Fill In The Blank" },
    { id: "matching",     label: "Matching"          },
    { id: "essay",        label: "Essay"             },
    { id: "short_answer", label: "Short Answer"      },
    { id: "numerical",    label: "Numerical"         },
    { id: "coding",       label: "Coding Question"   },
    { id: "file_upload",  label: "File Upload"       },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Question Sources</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sources.map((src) => (
            <button key={src.id} type="button" onClick={() => set({ questionSources: toggle(s.questionSources, src.id) })}
              className={cn("rounded-xl border-2 p-3 text-left transition", s.questionSources.includes(src.id) ? "border-[oklch(0.385_0.12_247)] bg-blue-50/30" : "border-border hover:border-foreground/30")}
            >
              <p className="text-sm font-medium">{src.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{src.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Supported Question Types</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {qTypes.map((t) => <Chip key={t.id} label={t.label} active={s.questionTypes.includes(t.id)} onClick={() => set({ questionTypes: toggle(s.questionTypes, t.id) })} />)}
        </div>
      </Card>

      <Card>
        <SectionTitle>Question Controls</SectionTitle>
        <div className="space-y-3">
          <Row label="Randomize Questions" hint="Different question order per candidate">
            <Toggle checked={s.randomizeQuestions} onChange={(v) => set({ randomizeQuestions: v })} />
          </Row>
          <Row label="Shuffle Answers" hint="Randomize MCQ answer option order">
            <Toggle checked={s.shuffleAnswers} onChange={(v) => set({ shuffleAnswers: v })} />
          </Row>
          <Row label="Candidate-Specific Sets" hint="Generate unique question sets from pool">
            <Toggle checked={s.candidateSets} onChange={(v) => set({ candidateSets: v })} />
          </Row>
        </div>
      </Card>

      <Card>
        <SectionTitle>Difficulty Levels</SectionTitle>
        <div className="flex flex-wrap items-center gap-4">
          {[
            { key: "difficultyEasy",   label: "Easy",   color: "text-emerald-700" },
            { key: "difficultyMedium", label: "Medium", color: "text-amber-700"   },
            { key: "difficultyHard",   label: "Hard",   color: "text-rose-700"    },
          ].map((d) => (
            <div key={d.key} className="flex items-center gap-2">
              <span className={cn("w-14 text-xs font-semibold", d.color)}>{d.label}</span>
              <Input type="number" min={0} max={100} value={(s as any)[d.key]} onChange={(e) => set({ [d.key]: +e.target.value } as any)} className="w-20" />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          ))}
          {diffTotal !== 100 && (
            <p className="text-xs text-amber-600 w-full"><AlertTriangle className="mr-1 inline h-3 w-3" />Should sum to 100% (currently {diffTotal}%)</p>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle>Filter Questions By</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-xs"><Hash className="h-3 w-3" /> Topic</Label>
            <Input value={s.filterTopic} onChange={(e) => set({ filterTopic: e.target.value })} placeholder="e.g. Data Structures" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-xs"><Tag className="h-3 w-3" /> Tags</Label>
            <Input value={s.filterTags} onChange={(e) => set({ filterTags: e.target.value })} placeholder="e.g. algorithms, sorting" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-xs"><Award className="h-3 w-3" /> Learning Outcomes</Label>
            <Input value={s.filterOutcomes} onChange={(e) => set({ filterOutcomes: e.target.value })} placeholder="e.g. LO1, LO2" />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Step 5 ───────────────────────────────────────────────────────────────────

function Step5({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const updateBoundary = (i: number, patch: Partial<GradeBoundary>) =>
    set({ gradeBoundaries: s.gradeBoundaries.map((b, idx) => idx === i ? { ...b, ...patch } : b) });

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Scoring Rules</SectionTitle>
        <div className="space-y-3">
          <Row label="Marks Per Question">
            <Input type="number" min={0.5} step={0.5} value={s.marksPerQuestion} onChange={(e) => set({ marksPerQuestion: +e.target.value })} className="w-24 h-8 text-sm" />
          </Row>
          <Row label="Negative Marking" hint="Deduct marks for wrong answers">
            <div className="flex items-center gap-3">
              <Toggle checked={s.negativeMarking} onChange={(v) => set({ negativeMarking: v })} />
              {s.negativeMarking && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span>Deduct</span>
                  <Input type="number" min={0} max={s.marksPerQuestion} step={0.25} value={s.negativeValue} onChange={(e) => set({ negativeValue: +e.target.value })} className="h-7 w-16 text-xs" />
                  <span>marks</span>
                </div>
              )}
            </div>
          </Row>
          <Row label="Bonus Marks" hint="Award bonus for exceptional performance">
            <Toggle checked={s.bonusMarks} onChange={(v) => set({ bonusMarks: v })} />
          </Row>
          <Row label="Partial Credit" hint="Award partial marks for partially correct answers">
            <Toggle checked={s.partialCredit} onChange={(v) => set({ partialCredit: v })} />
          </Row>
        </div>
      </Card>

      <Card>
        <SectionTitle>Grade System</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "percentage", label: "Percentage" },
            { id: "gpa",        label: "GPA" },
            { id: "letter",     label: "Letter Grade" },
            { id: "pass_fail",  label: "Pass / Fail" },
          ].map((g) => <Chip key={g.id} label={g.label} active={s.gradingSystem === g.id} onClick={() => set({ gradingSystem: g.id })} />)}
        </div>
      </Card>

      {s.gradingSystem !== "pass_fail" && (
        <Card>
          <SectionTitle>Grade Boundaries</SectionTitle>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-3 text-xs font-semibold text-muted-foreground px-1 pb-1">
              <span>Grade</span><span>Min %</span><span>Max %</span>
            </div>
            {s.gradeBoundaries.map((b, i) => (
              <div key={i} className="grid grid-cols-3 items-center gap-3">
                <Input value={b.label} onChange={(e) => updateBoundary(i, { label: e.target.value })} className="h-8 text-center text-sm font-bold" placeholder="A" />
                <Input type="number" min={0} max={100} value={b.min} onChange={(e) => updateBoundary(i, { min: +e.target.value })} className="h-8 text-xs" />
                <Input type="number" min={0} max={100} value={b.max} onChange={(e) => updateBoundary(i, { max: +e.target.value })} className="h-8 text-xs" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Step 6 ───────────────────────────────────────────────────────────────────

function Step6({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Scheduling</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Examination Date</Label>
            <Input type="date" value={s.examDate} onChange={(e) => set({ examDate: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Start Time</Label>
            <Input type="time" value={s.startTime} onChange={(e) => set({ startTime: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>End Time</Label>
            <Input type="time" value={s.endTime} onChange={(e) => set({ endTime: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Duration (minutes)</Label>
            <Input type="number" min={5} value={s.duration} onChange={(e) => set({ duration: +e.target.value })} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Availability Settings</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "fixed",    label: "Fixed Window",     desc: "Exam opens and closes at set times" },
            { id: "flexible", label: "Flexible Window",  desc: "Candidates start within a time window" },
            { id: "sessions", label: "Multiple Sessions", desc: "Multiple slots available" },
          ].map((w) => (
            <button key={w.id} type="button" onClick={() => set({ windowType: w.id })}
              className={cn("rounded-xl border-2 p-3 text-left transition", s.windowType === w.id ? "border-[oklch(0.385_0.12_247)] bg-blue-50/30" : "border-border hover:border-foreground/30")}
            >
              <p className="text-sm font-medium">{w.label}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{w.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Submission Rules</SectionTitle>
        <div className="space-y-3">
          <Row label="Automatic Submission" hint="Submit when time expires">
            <Toggle checked={s.autoSubmit} onChange={(v) => set({ autoSubmit: v })} />
          </Row>
          <Row label="Grace Period (minutes)" hint="Extra seconds after timer ends">
            <Input type="number" min={0} value={s.gracePeriod} onChange={(e) => set({ gracePeriod: +e.target.value })} className="w-20 h-8 text-sm" />
          </Row>
          <Row label="Late Submission Policy">
            <select value={s.latePolicy} onChange={(e) => set({ latePolicy: e.target.value })} className="h-8 rounded-md border border-border bg-background px-2 text-xs">
              <option value="disallow">Disallow</option>
              <option value="penalty">Allow with Penalty</option>
              <option value="allow">Allow No Penalty</option>
            </select>
          </Row>
        </div>
      </Card>
    </div>
  );
}

// ─── Step 7 ───────────────────────────────────────────────────────────────────

function Step7({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const browserControls = [
    { key: "secFullscreen",       label: "Fullscreen Enforcement",    desc: "Force fullscreen during exam" },
    { key: "secDisableCopy",      label: "Disable Copy",              desc: "Block Ctrl+C and copy actions" },
    { key: "secDisablePaste",     label: "Disable Paste",             desc: "Block Ctrl+V paste actions" },
    { key: "secDisablePrint",     label: "Disable Printing",          desc: "Block Ctrl+P and print dialogs" },
    { key: "secDisableScreenshot",label: "Disable Screenshots",       desc: "Block PrtScr and snipping tools" },
    { key: "secDisableRightClick",label: "Disable Right Click",       desc: "Block context menu access" },
    { key: "secDisableDevTools",  label: "Disable Developer Tools",   desc: "Block F12 and devtools" },
  ];
  const authOptions = [
    { key: "authStudentLogin",  label: "Student Login",        desc: "Require institutional login" },
    { key: "authExamPassword",  label: "Exam Password",        desc: "Unique per-exam password" },
    { key: "authExamPin",       label: "Exam PIN",             desc: "Short numeric PIN" },
    { key: "auth2FA",           label: "Two-Factor Authentication", desc: "OTP via SMS or authenticator app" },
  ];
  const proctoring = [
    { key: "procWebcam",  label: "Webcam Monitoring",    desc: "Live video capture" },
    { key: "procMic",     label: "Microphone Monitoring",desc: "Audio recording" },
    { key: "procScreen",  label: "Screen Recording",     desc: "Record candidate screen" },
    { key: "procAI",      label: "AI Proctoring",        desc: "Behavioural AI analysis" },
    { key: "procFacial",  label: "Facial Verification",  desc: "Match face to ID" },
  ];
  const violations = [
    { key: "detectTabSwitch",    label: "Tab Switching",            desc: "Flag when candidate switches tabs" },
    { key: "detectMultiFace",    label: "Multiple Faces",           desc: "Detect more than one face" },
    { key: "detectMultiScreen",  label: "Multiple Screens",         desc: "Detect extra display connections" },
    { key: "detectUnauthorized", label: "Unauthorized Browser Activity", desc: "Detect disallowed apps or URLs" },
    { key: "detectNetwork",      label: "Network Disruptions",      desc: "Log connectivity interruptions" },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Browser Controls</SectionTitle>
        <div className="space-y-2">
          {browserControls.map((r) => (
            <Row key={r.key} label={r.label} hint={r.desc}>
              <Toggle checked={(s as any)[r.key]} onChange={(v) => set({ [r.key]: v } as any)} />
            </Row>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Authentication</SectionTitle>
        <div className="space-y-2">
          {authOptions.map((a) => (
            <Row key={a.key} label={a.label} hint={a.desc}>
              <Toggle checked={(s as any)[a.key]} onChange={(v) => set({ [a.key]: v } as any)} />
            </Row>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Proctoring</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {proctoring.map((p) => (
            <button key={p.key} type="button" onClick={() => set({ [p.key]: !(s as any)[p.key] } as any)}
              className={cn("flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition", (s as any)[p.key] ? "border-[oklch(0.385_0.12_247)] bg-blue-50/30" : "border-border hover:border-foreground/30")}
            >
              <Eye className={cn("h-4 w-4", (s as any)[p.key] ? "text-[oklch(0.385_0.12_247)]" : "text-muted-foreground")} />
              <span className="text-[11px] font-medium text-center leading-tight">{p.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Violation Detection</SectionTitle>
        <div className="space-y-2">
          {violations.map((v) => (
            <Row key={v.key} label={v.label} hint={v.desc}>
              <Toggle checked={(s as any)[v.key]} onChange={(val) => set({ [v.key]: val } as any)} />
            </Row>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Step 8 – Rich text instructions ─────────────────────────────────────────

function RichTextarea({ label, value, onChange, placeholder, rows = 4 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const wrap = (prefix: string, suffix: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = value.slice(start, end);
    const next = value.slice(0, start) + prefix + sel + suffix + value.slice(end);
    onChange(next);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + prefix.length, end + prefix.length); }, 0);
  };
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-1 border-b border-border bg-muted/30 px-2 py-1.5">
          {[
            { icon: Bold,   action: () => wrap("**", "**"),  title: "Bold" },
            { icon: Italic, action: () => wrap("_", "_"),    title: "Italic" },
            { icon: List,   action: () => wrap("\n- ", ""),  title: "List" },
            { icon: Link,   action: () => wrap("[", "](url)"), title: "Link" },
          ].map(({ icon: Icon, action, title }) => (
            <button key={title} type="button" title={title} onClick={action}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            ><Icon className="h-3.5 w-3.5" /></button>
          ))}
          <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
            <Paperclip className="h-3 w-3" /><span>Attachments: images, PDFs</span>
          </div>
        </div>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full resize-y bg-background px-3 py-2.5 text-sm focus:outline-none"
        />
      </div>
    </div>
  );
}

function Step8({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-5">
      <Card>
        <RichTextarea label="General Instructions" value={s.generalInstructions} onChange={(v) => set({ generalInstructions: v })} rows={6} placeholder="Write the main examination instructions here. Include any important rules candidates must follow…" />
      </Card>
      <Card>
        <RichTextarea label="Exam Rules" value={s.examRules} onChange={(v) => set({ examRules: v })} rows={4} placeholder="List the rules and regulations for this examination…" />
      </Card>
      <Card>
        <RichTextarea label="Allowed Materials" value={s.allowedMaterials} onChange={(v) => set({ allowedMaterials: v })} rows={3} placeholder="e.g. Calculator, Open book, Scratch paper…" />
      </Card>
      <Card>
        <RichTextarea label="Prohibited Activities" value={s.prohibitedActivities} onChange={(v) => set({ prohibitedActivities: v })} rows={3} placeholder="e.g. No mobile phones, No external websites, No communication with others…" />
      </Card>
      <Card>
        <RichTextarea label="Technical Requirements" value={s.technicalRequirements} onChange={(v) => set({ technicalRequirements: v })} rows={3} placeholder="e.g. Stable internet, Chrome browser, Webcam must be enabled…" />
      </Card>
    </div>
  );
}

// ─── Step 9 ───────────────────────────────────────────────────────────────────

function Step9({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  return (
    <Card>
      <SectionTitle>Accessibility Settings</SectionTitle>
      <div className="space-y-3">
        <Row label="Extended Time" hint="Grant additional time for eligible candidates">
          <Toggle checked={s.extraTime} onChange={(v) => set({ extraTime: v })} />
        </Row>
        {s.extraTime && (
          <Row label="Extra Time (minutes)">
            <Input type="number" min={5} value={s.extraTimeMinutes} onChange={(e) => set({ extraTimeMinutes: +e.target.value })} className="w-20 h-8 text-sm" />
          </Row>
        )}
        <Row label="Large Text Mode" hint="Increase font size for readability">
          <Toggle checked={s.largeText} onChange={(v) => set({ largeText: v })} />
        </Row>
        <Row label="High Contrast Mode" hint="Enhanced contrast for visual impairment">
          <Toggle checked={s.highContrast} onChange={(v) => set({ highContrast: v })} />
        </Row>
        <Row label="Screen Reader Support" hint="Full ARIA compatibility for assistive technology">
          <Toggle checked={s.screenReader} onChange={(v) => set({ screenReader: v })} />
        </Row>
      </div>
    </Card>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

interface ValidationIssue { type: "error" | "warning" | "suggestion"; category: string; message: string; }

function validate(s: WizardState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  // Content
  if (!s.title.trim()) issues.push({ type: "error", category: "Content", message: "Examination title is required." });
  if (!s.category) issues.push({ type: "error", category: "Content", message: "Examination category must be selected." });
  if (s.sections.length === 0) issues.push({ type: "error", category: "Content", message: "At least one section is required." });
  if (s.sections.some((sec) => sec.questionCount < 1)) issues.push({ type: "error", category: "Content", message: "All sections must have at least 1 question." });
  if (s.sections.some((sec) => sec.marks < 1)) issues.push({ type: "warning", category: "Content", message: "Some sections have 0 marks — candidates cannot score." });
  const totalSectionQ = s.sections.reduce((a, sec) => a + sec.questionCount, 0);
  if (totalSectionQ !== s.totalQuestions && s.totalQuestions > 0) issues.push({ type: "warning", category: "Content", message: `Section total (${totalSectionQ}) differs from total questions setting (${s.totalQuestions}).` });
  if (!s.generalInstructions.trim()) issues.push({ type: "suggestion", category: "Content", message: "Add general instructions so candidates know what to expect." });
  // Scheduling
  if (!s.examDate) issues.push({ type: "warning", category: "Scheduling", message: "No exam date set — exam cannot be scheduled." });
  if (s.examDate && s.startTime && s.endTime && s.startTime >= s.endTime) issues.push({ type: "error", category: "Scheduling", message: "End time must be after start time." });
  if (s.examDate && s.startTime) {
    const dt = new Date(s.examDate + "T" + s.startTime);
    if (dt < new Date()) issues.push({ type: "warning", category: "Scheduling", message: "Exam date/time is in the past." });
  }
  // Security
  if (!s.authStudentLogin && !s.authExamPassword && !s.authExamPin && !s.auth2FA) issues.push({ type: "warning", category: "Security", message: "No authentication method configured." });
  if (s.examMode === "online" && !s.procWebcam && !s.procAI) issues.push({ type: "suggestion", category: "Security", message: "Online exam with no proctoring — consider enabling webcam or AI proctoring." });
  return issues;
}

// ─── Step 10 – Review ─────────────────────────────────────────────────────────

function Step10({ s }: { s: WizardState }) {
  const issues = validate(s);
  const errors = issues.filter((i) => i.type === "error");
  const warnings = issues.filter((i) => i.type === "warning");
  const suggestions = issues.filter((i) => i.type === "suggestion");
  const cats = ["Content", "Scheduling", "Security"];

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Validation Results</SectionTitle>
        {issues.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div><p className="font-semibold text-sm">All checks passed</p><p className="text-xs mt-0.5">Your examination is ready to publish.</p></div>
          </div>
        ) : (
          <div className="space-y-4">
            {cats.map((cat) => {
              const catIssues = issues.filter((i) => i.category === cat);
              if (!catIssues.length) return null;
              return (
                <div key={cat}>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{cat} Validation</p>
                  <div className="space-y-1.5">
                    {catIssues.map((issue, i) => (
                      <div key={i} className={cn("flex items-start gap-2 rounded-lg p-3 text-xs", issue.type === "error" ? "bg-rose-50 text-rose-700" : issue.type === "warning" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700")}>
                        {issue.type === "error" ? <XCircle className="h-4 w-4 shrink-0 mt-0.5" /> : issue.type === "warning" ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> : <Info className="h-4 w-4 shrink-0 mt-0.5" />}
                        {issue.message}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Configuration Summary</SectionTitle>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Title", s.title || "—"],
            ["Category", s.category || "—"],
            ["Mode", s.examMode],
            ["Sections", String(s.sections.length)],
            ["Total Marks", String(s.sections.reduce((a, sec) => a + sec.marks, 0))],
            ["Total Questions", String(s.sections.reduce((a, sec) => a + sec.questionCount, 0))],
            ["Duration", s.duration + " min"],
            ["Exam Date", s.examDate || "Not set"],
            ["Grading", s.gradingSystem],
            ["Proctoring", [s.procWebcam && "Webcam", s.procAI && "AI", s.procScreen && "Screen"].filter(Boolean).join(", ") || "None"],
            ["Auth", [s.authStudentLogin && "Login", s.authExamPassword && "Password", s.authExamPin && "PIN", s.auth2FA && "2FA"].filter(Boolean).join(", ") || "None"],
            ["Accessibility", [s.extraTime && "Extra Time", s.largeText && "Large Text", s.highContrast && "High Contrast", s.screenReader && "Screen Reader"].filter(Boolean).join(", ") || "None"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-2 border-b border-border py-2">
              <span className="text-muted-foreground shrink-0">{label}</span>
              <span className="font-medium text-right truncate">{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Step 11 – Preview ────────────────────────────────────────────────────────

function Step11({ s }: { s: WizardState }) {
  const [previewMode, setPreviewMode] = useState<"candidate" | "mobile" | "accessibility">("candidate");
  const totalMarks = s.sections.reduce((a, sec) => a + sec.marks, 0);
  const totalQ = s.sections.reduce((a, sec) => a + sec.questionCount, 0);

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Preview Mode</SectionTitle>
        <div className="flex gap-2">
          {[
            { id: "candidate",    label: "Candidate View",       icon: Eye },
            { id: "mobile",       label: "Mobile Preview",       icon: Smartphone },
            { id: "accessibility",label: "Accessibility Preview", icon: Accessibility },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.id} type="button" onClick={() => setPreviewMode(m.id as any)}
                className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition", previewMode === m.id ? "text-white" : "border-border text-muted-foreground hover:bg-muted")}
                style={previewMode === m.id ? { background: NAVY } : undefined}
              >
                <Icon className="h-3.5 w-3.5" />{m.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Candidate / Mobile / Accessibility preview */}
      <div className={cn("mx-auto rounded-2xl border-2 border-border bg-background shadow-xl overflow-hidden transition-all", previewMode === "mobile" ? "max-w-sm" : "max-w-full")}>
        {/* Mock exam header */}
        <div className="px-6 py-4 border-b border-border" style={{ background: NAVY }}>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn("font-bold text-white", previewMode === "accessibility" ? "text-xl" : "text-base")}>{s.title || "Examination Title"}</p>
              <p className={cn("text-blue-200", previewMode === "accessibility" ? "text-base mt-1" : "text-xs")}>{s.code || "EXAM-CODE"} · {s.course || "Course"}</p>
            </div>
            <div className="text-right">
              <div className={cn("rounded-lg bg-white/10 px-3 py-1.5 tabular-nums font-mono font-bold text-white", previewMode === "accessibility" ? "text-xl" : "text-sm")}>{String(Math.floor(s.duration / 60)).padStart(2, "0")}:{String(s.duration % 60).padStart(2, "0")}:00</div>
              <p className="text-[11px] text-blue-200 mt-0.5">Time Remaining</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-0 rounded-full bg-white transition-all" />
          </div>
          <p className="mt-1 text-[10px] text-blue-200">0 of {totalQ} questions answered</p>
        </div>

        {/* Mock question area */}
        <div className={cn("p-6", previewMode === "accessibility" && s.highContrast ? "bg-black text-white" : "")}>
          {previewMode === "accessibility" && s.largeText && (
            <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-700">Extended time and large text accessibility settings are active</div>
          )}
          {s.generalInstructions && (
            <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Instructions</p>
              <p className={cn("whitespace-pre-wrap text-sm", previewMode === "accessibility" && s.largeText ? "text-base" : "")}>{s.generalInstructions.slice(0, 200)}{s.generalInstructions.length > 200 ? "…" : ""}</p>
            </div>
          )}

          {/* Section tabs */}
          <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto">
            {s.sections.map((sec, i) => (
              <button key={sec.id} type="button" className={cn("shrink-0 rounded-t-lg border border-b-0 border-border px-3 py-1.5 text-xs font-medium transition", i === 0 ? "text-white" : "bg-background text-muted-foreground")} style={i === 0 ? { background: NAVY } : undefined}>
                {sec.title}
              </button>
            ))}
          </div>

          {/* Mock question */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: NAVY }}>1</span>
                <div className="flex-1">
                  <p className={cn("font-medium", previewMode === "accessibility" && s.largeText ? "text-base" : "text-sm")}>
                    {s.sections[0]?.type === "mcq" ? "Which of the following best describes an algorithm?" : s.sections[0]?.type === "true_false" ? "A stack follows FIFO (First In First Out) order." : "Explain the difference between a stack and a queue."}
                  </p>
                  {s.sections[0]?.type === "mcq" && (
                    <div className="mt-3 space-y-2">
                      {["A step-by-step procedure for solving a problem", "A type of programming language", "A hardware component", "A network protocol"].map((opt, i) => (
                        <label key={i} className={cn("flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm cursor-pointer hover:bg-muted/40 transition", previewMode === "accessibility" && s.largeText ? "text-base p-3" : "")}>
                          <input type="radio" name="q1" className="shrink-0" />
                          {String.fromCharCode(65 + i)}. {opt}
                        </label>
                      ))}
                    </div>
                  )}
                  {s.sections[0]?.type === "true_false" && (
                    <div className="mt-3 flex gap-3">
                      {["True", "False"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm cursor-pointer hover:bg-muted/40">
                          <input type="radio" name="q1tf" /> {opt}
                        </label>
                      ))}
                    </div>
                  )}
                  {!["mcq","true_false"].includes(s.sections[0]?.type ?? "") && (
                    <textarea rows={4} placeholder="Type your answer here…" className={cn("mt-3 w-full rounded-lg border border-border bg-muted/30 px-3 py-2 resize-none text-sm", previewMode === "accessibility" && s.largeText ? "text-base" : "")} />
                  )}
                </div>
                <span className={cn("shrink-0 text-xs text-muted-foreground tabular-nums", previewMode === "accessibility" && s.largeText ? "text-sm" : "")}>
                  {s.marksPerQuestion} {s.marksPerQuestion === 1 ? "mark" : "marks"}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <Button variant="outline" size="sm" className="gap-1.5"><ChevronLeft className="h-4 w-4" /> Previous</Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalQ, 8) }, (_, i) => (
                <div key={i} className={cn("h-6 w-6 rounded text-[10px] font-semibold flex items-center justify-center", i === 0 ? "text-white" : "bg-muted text-muted-foreground")} style={i === 0 ? { background: NAVY } : undefined}>{i + 1}</div>
              ))}
              {totalQ > 8 && <span className="text-xs text-muted-foreground px-1 self-center">+{totalQ - 8}</span>}
            </div>
            <Button size="sm" className="gap-1.5 text-white" style={{ background: NAVY }}>Next <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Mock status bar */}
        <div className={cn("flex items-center justify-between border-t border-border px-6 py-2 text-[11px] text-muted-foreground", previewMode === "accessibility" && s.highContrast ? "bg-gray-900 text-gray-300" : "bg-muted/30")}>
          <span>Total Marks: {totalMarks}</span>
          <span>{s.procWebcam ? "🎥 Proctored" : "📋 Unproctored"}</span>
          <span>{s.secFullscreen ? "🔒 Fullscreen" : "🔓 Normal"}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Examination Summary Card ─────────────────────────────────────────────────

function ExamSummaryCard({ s, examId, onClose }: { s: WizardState; examId: string; onClose: () => void }) {
  const totalMarks = s.sections.reduce((a, sec) => a + sec.marks, 0);
  const totalQ = s.sections.reduce((a, sec) => a + sec.questionCount, 0);
  const securityLevel = [s.procAI, s.procWebcam, s.auth2FA, s.secFullscreen].filter(Boolean).length;
  const secLabel = securityLevel >= 3 ? "High" : securityLevel >= 1 ? "Medium" : "Basic";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4" style={{ background: NAVY }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">Examination Created!</p>
              <p className="text-xs text-blue-200">ID: {examId.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-white/70 hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6">
          <h3 className="font-bold text-lg mb-4">{s.title}</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Exam Code",    value: s.code || "—" },
              { label: "Course",       value: s.course || "—" },
              { label: "Questions",    value: String(totalQ) },
              { label: "Total Marks",  value: String(totalMarks) },
              { label: "Duration",     value: s.duration + " min" },
              { label: "Candidates",   value: "—" },
              { label: "Exam Date",    value: s.examDate || "Not scheduled" },
              { label: "Security",     value: secLabel },
              { label: "Status",       value: s.publishOption === "immediate" ? "Published" : "Draft" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2">
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className="font-semibold text-xs text-right">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            <Button className="flex-1 text-white gap-2" style={{ background: NAVY }} onClick={onClose}>
              <BookOpen className="h-4 w-4" /> Open Question Builder
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">Done</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 12 – Publish ────────────────────────────────────────────────────────

function Step12({ s, set, onPublish, isPublishing }: {
  s: WizardState; set: (p: Partial<WizardState>) => void;
  onPublish: () => void; isPublishing: boolean;
}) {
  const errors = validate(s).filter((i) => i.type === "error");
  const options = [
    { id: "draft",     label: "Save as Draft",     icon: Save,     desc: "Not visible to candidates. Continue editing any time.", color: "amber" },
    { id: "scheduled", label: "Schedule Publication", icon: Calendar, desc: "Automatically publish at the set exam date and time.", color: "sky" },
    { id: "immediate", label: "Publish Immediately",  icon: Zap,      desc: "Exam becomes active and accessible to candidates now.", color: "emerald" },
    { id: "private",   label: "Private Examination",  icon: Lock,     desc: "Accessible only through a direct invitation link.", color: "violet" },
  ];
  const colorMap: Record<string, string> = { amber: "bg-amber-50 border-amber-200 text-amber-700", sky: "bg-sky-50 border-sky-200 text-sky-700", emerald: "bg-emerald-50 border-emerald-200 text-emerald-700", violet: "bg-violet-50 border-violet-200 text-violet-700" };

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Publishing Options</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button key={opt.id} type="button" onClick={() => set({ publishOption: opt.id })}
                className={cn("flex items-start gap-3 rounded-xl border-2 p-4 text-left transition", s.publishOption === opt.id ? "border-[oklch(0.385_0.12_247)] bg-blue-50/30" : "border-border hover:border-foreground/30")}
              >
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", colorMap[opt.color])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {errors.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-rose-700 mb-2">
            <XCircle className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">{errors.length} error{errors.length > 1 ? "s" : ""} must be resolved before publishing</p>
          </div>
          {errors.map((e, i) => <p key={i} className="text-xs text-rose-700 ml-6">• {e.message}</p>)}
        </div>
      )}

      <Button className="w-full gap-2 text-white h-12 text-base" style={{ background: NAVY }} onClick={onPublish} disabled={isPublishing || errors.length > 0}>
        {isPublishing ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Creating Examination…</>
        ) : (
          <><Send className="h-5 w-5" />{s.publishOption === "draft" ? "Save as Draft" : s.publishOption === "scheduled" ? "Schedule Examination" : s.publishOption === "immediate" ? "Publish Now" : "Publish as Private"}</>
        )}
      </Button>
    </div>
  );
}

// ─── AI Assistant ─────────────────────────────────────────────────────────────

const AI_TIPS: Record<number, string[]> = {
  1:  ["Use a clear title with course code and semester for easy identification.", "Match the exam category exactly — it affects grading rules and reporting.", "Online mode enables full proctoring and remote access."],
  2:  ["Department-level assignment is the most common for institutional exams.", "Dynamic Enrollment auto-syncs with your SIS — ideal for large cohorts.", "Restrict candidates early to avoid last-minute access issues."],
  3:  ["Standard structure: Section A (MCQ), Section B (Short Answer), Section C (Essay).", "Per-section time limits keep candidates on pace in long exams.", "Mark allocation should reflect the cognitive demand of each section."],
  4:  ["A 40/40/20 easy/medium/hard split suits most end-of-semester exams.", "Enable question pooling to generate unique sets per candidate.", "Filter by learning outcomes to ensure curriculum alignment."],
  5:  ["Negative marking of 0.25 per wrong MCQ discourages random guessing.", "Use Pass/Fail grading for certification and compliance exams.", "Partial credit is most effective for numerical and coding questions."],
  6:  ["Schedule at least 48 hours in advance to allow candidate preparation.", "Fixed window prevents timing variability across the cohort.", "Enable auto-submission to ensure consistent end times."],
  7:  ["Fullscreen + tab-switch detection is the minimum recommended config.", "AI proctoring is recommended for high-stakes certification exams.", "2FA adds a strong layer of identity verification."],
  8:  ["Clear, numbered instructions reduce candidate confusion and support calls.", "List prohibited materials explicitly to avoid disputes during review.", "Technical requirements set expectations before exam day."],
  9:  ["Offer extended time for candidates with documented accessibility needs.", "High contrast and large text improve readability for visual impairments.", "Screen reader support ensures WCAG 2.1 compliance."],
  10: ["Resolve all errors before proceeding — warnings can be addressed later.", "Check scheduling conflicts with other exams in the same time slot.", "Missing security rules are common — review authentication settings."],
  11: ["Review the candidate view to catch confusing layouts before publishing.", "Mobile preview is critical for candidates on phones or tablets.", "Accessibility preview validates compliance before submission."],
  12: ["Save as Draft to add questions in the builder before going live.", "Schedule publication to automate the exam opening — no manual action needed.", "Private mode is ideal for invitation-only certification exams."],
};

function AIPanel({ step, onClose }: { step: number; onClose: () => void }) {
  const tips = AI_TIPS[step] ?? [];
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-background shadow-xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: NAVY }}>
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step {step} Recommendations</p>
        {tips.map((tip, i) => (
          <div key={i} className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed">
            <span className="mr-1.5 font-bold" style={{ color: NAVY }}>•</span>{tip}
          </div>
        ))}
        <div className="rounded-xl border border-border bg-background p-3 mt-3">
          <p className="text-xs font-semibold mb-1">Capabilities</p>
          <div className="space-y-1">
            {["Generate Questions", "Write Instructions", "Recommend Security", "Estimate Completion Time", "Detect Config Issues", "Suggest Mark Distribution"].map((c) => (
              <button key={c} type="button" className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition text-left">
                <Sparkles className="h-3 w-3" style={{ color: NAVY }} />{c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

function ExamWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...INITIAL, ...JSON.parse(saved) } : INITIAL;
    } catch { return INITIAL; }
  });
  const [showAI, setShowAI] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [createdExamId, setCreatedExamId] = useState<string | null>(null);

  const set = useCallback((patch: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  // Auto-save every 10 s
  useEffect(() => {
    const id = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setLastSaved(new Date());
    }, 10_000);
    return () => clearInterval(id);
  }, [state]);

  const publishMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const status = state.publishOption === "immediate" ? "published" : "draft";
      const term = [state.academicYear, state.semester].filter(Boolean).join(" ") || null;

      const { data: exam, error: examErr } = await supabase
        .from("exams")
        .insert({ title: state.title.trim(), term, status, created_by: user.id })
        .select("id")
        .single();
      if (examErr || !exam) throw examErr ?? new Error("Failed to create exam");

      if (state.sections.length > 0) {
        const rows = state.sections.map((sec, i) => ({ exam_id: exam.id, title: sec.title, position: i, time_limit_minutes: sec.timeLimitMinutes }));
        const { error: secErr } = await supabase.from("exam_sections").insert(rows);
        if (secErr) throw secErr;
      }

      if (state.examDate && state.startTime) {
        const startAt = new Date(`${state.examDate}T${state.startTime}`).toISOString();
        const endAt = state.endTime
          ? new Date(`${state.examDate}T${state.endTime}`).toISOString()
          : new Date(new Date(`${state.examDate}T${state.startTime}`).getTime() + state.duration * 60_000).toISOString();
        await supabase.from("exam_schedules").insert({
          exam_id: exam.id, created_by: user.id, organization_id: null,
          start_at: startAt, end_at: endAt,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          max_concurrent: 0, notify_confirmation: false, notify_proctors: false,
          notify_reminder: false, waitlist_enabled: false,
        });
      }

      localStorage.removeItem(STORAGE_KEY);
      return exam.id;
    },
    onSuccess: (examId) => {
      setCreatedExamId(examId);
      toast.success(state.publishOption === "immediate" ? "Examination published!" : "Draft saved successfully.");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create examination."),
  });

  const canProceed = () => {
    if (step === 1) return !!state.title.trim() && !!state.category;
    return true;
  };

  // Steps 10, 11, 12 have custom props — exclude from generic array
  const GenericStep = [null, Step1, Step2, Step3, Step4, Step5, Step6, Step7, Step8, Step9, null, null, null][step];

  return (
    <AdminShell title="Create New Examination" breadcrumbs={[{ label: "Exams", to: "/admin/exams" }, { label: "Create New" }]}>
      {createdExamId && (
        <ExamSummaryCard
          s={state}
          examId={createdExamId}
          onClose={() => navigate({ to: "/admin/exams/$examId/builder", params: { examId: createdExamId } })}
        />
      )}

      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex gap-6">
          {/* Step sidebar */}
          <div className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-6 space-y-0.5">
              {STEPS.map((s_) => {
                const Icon = s_.icon;
                const done = s_.num < step;
                const active = s_.num === step;
                return (
                  <button key={s_.num} onClick={() => s_.num < step && setStep(s_.num)}
                    className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition", active ? "text-white" : done ? "text-muted-foreground hover:bg-muted" : "text-muted-foreground/50 cursor-default")}
                    style={active ? { background: NAVY } : undefined}
                  >
                    <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", active ? "bg-white/20 text-white" : done ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")}>
                      {done ? <Check className="h-3 w-3" /> : s_.num}
                    </div>
                    <span className="truncate">{s_.label}</span>
                  </button>
                );
              })}

              <div className="mt-4 border-t border-border pt-4 space-y-0.5">
                <button onClick={() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setLastSaved(new Date()); toast.success("Draft saved."); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
                >
                  <Save className="h-3.5 w-3.5" />
                  {lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Save Draft"}
                </button>
                <button onClick={() => setShowAI(!showAI)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted">
                  <Sparkles className="h-3.5 w-3.5" /> AI Assistant
                </button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="min-w-0 flex-1">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Step {step} of {STEPS.length}</span>
                  <span>·</span>
                  <span>{STEPS[step - 1].label}</span>
                </div>
                <h2 className="mt-0.5 text-xl font-semibold">{STEPS[step - 1].label}</h2>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowAI(!showAI)} className="hidden xl:flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: NAVY }} /> AI
                </button>
                <div className="hidden sm:flex h-2 w-32 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%`, background: NAVY }} />
                </div>
                <span className="text-xs text-muted-foreground">{Math.round((step / STEPS.length) * 100)}%</span>
              </div>
            </div>

            {GenericStep ? (
              <GenericStep s={state} set={set} />
            ) : step === 10 ? (
              <Step10 s={state} />
            ) : step === 11 ? (
              <Step11 s={state} />
            ) : step === 12 ? (
              <Step12 s={state} set={set} onPublish={() => publishMutation.mutate()} isPublishing={publishMutation.isPending} />
            ) : null}

            <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
              <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : navigate({ to: "/admin/exams" })} className="gap-1.5">
                <ChevronLeft className="h-4 w-4" />{step === 1 ? "Cancel" : "Back"}
              </Button>
              {step < STEPS.length && (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-1.5 text-white" style={{ background: NAVY }}>
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* AI Panel */}
          {showAI && (
            <div className="hidden w-72 shrink-0 xl:block">
              <div className="sticky top-6">
                <AIPanel step={step} onClose={() => setShowAI(false)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
