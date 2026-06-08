import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ChevronRight, ChevronLeft, Check, AlertTriangle, Info,
  Sparkles, X, Plus, Trash2, GripVertical, Clock, Shield,
  Users, BookOpen, Settings, Eye, Send, Zap, Lock,
  MonitorSmartphone, Cpu, FileText, Calendar, Target,
  RotateCcw, CheckCircle2, XCircle, Loader2, Save,
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
  head: () => ({ meta: [{ title: "New Examination · Orcalis Assess" }] }),
});

const NAVY = "oklch(0.385 0.12 247)";
const STORAGE_KEY = "orcalis_exam_wizard_draft";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GradeBoundary { label: string; min: number; max: number; }
interface Section {
  id: string; title: string; type: string;
  questionCount: number; marks: number;
  mandatory: boolean; randomize: boolean; timeLimitMinutes: number | null;
}

interface WizardState {
  // Step 1
  title: string; code: string; academicYear: string; semester: string;
  department: string; faculty: string; program: string; course: string;
  subject: string; description: string; examType: string; examMode: string;
  // Step 2
  candidateMethod: string; selectedFaculty: string; selectedDept: string;
  // Step 3
  questionSources: string[]; questionTypes: string[];
  totalQuestions: number; randomSelection: boolean;
  pooling: boolean; difficultyEasy: number; difficultyMedium: number; difficultyHard: number;
  // Step 4
  sections: Section[];
  // Step 5
  marksPerQuestion: number; negativeMarking: boolean; negativeValue: number;
  bonusMarks: boolean; partialCredit: boolean;
  gradingSystem: string; gradeBoundaries: GradeBoundary[];
  // Step 6
  examDate: string; startTime: string; endTime: string; duration: number;
  windowType: string; autoSubmit: boolean; lateSubmission: boolean; gracePeriod: number;
  // Step 7
  secFullScreen: boolean; secDisableCopy: boolean; secDisablePaste: boolean;
  secDisablePrint: boolean; secDisableScreenshot: boolean; secDisableDevTools: boolean;
  verificationMethod: string; webcam: boolean; screenMonitor: boolean;
  audioMonitor: boolean; aiProctoring: boolean;
  detectTabSwitch: boolean; detectMultiScreen: boolean;
  detectMultiFace: boolean; detectSuspicious: boolean;
  // Step 8
  randomizeQuestions: boolean; randomizeAnswers: boolean; candidateSpecificSets: boolean;
  // Step 9
  extraTime: boolean; extraTimeMinutes: number;
  largeText: boolean; highContrast: boolean; screenReader: boolean;
  // Step 10
  instructions: string; materialsAllowed: string;
  prohibited: string; submissionGuidelines: string; technicalRequirements: string;
  // Step 12
  publishOption: string;
}

const DEFAULT_BOUNDARIES: GradeBoundary[] = [
  { label: "A", min: 80, max: 100 },
  { label: "B", min: 70, max: 79 },
  { label: "C", min: 60, max: 69 },
  { label: "D", min: 50, max: 59 },
  { label: "F", min: 0,  max: 49 },
];

const INITIAL_STATE: WizardState = {
  title: "", code: "", academicYear: "", semester: "", department: "",
  faculty: "", program: "", course: "", subject: "", description: "",
  examType: "", examMode: "online",
  candidateMethod: "department", selectedFaculty: "", selectedDept: "",
  questionSources: ["bank"], questionTypes: ["mcq"],
  totalQuestions: 40, randomSelection: true, pooling: false,
  difficultyEasy: 40, difficultyMedium: 40, difficultyHard: 20,
  sections: [{ id: crypto.randomUUID(), title: "Section A", type: "mcq", questionCount: 40, marks: 40, mandatory: true, randomize: true, timeLimitMinutes: null }],
  marksPerQuestion: 1, negativeMarking: false, negativeValue: 0.25,
  bonusMarks: false, partialCredit: false,
  gradingSystem: "percentage", gradeBoundaries: DEFAULT_BOUNDARIES,
  examDate: "", startTime: "", endTime: "", duration: 60,
  windowType: "fixed", autoSubmit: true, lateSubmission: false, gracePeriod: 5,
  secFullScreen: true, secDisableCopy: true, secDisablePaste: true,
  secDisablePrint: true, secDisableScreenshot: true, secDisableDevTools: true,
  verificationMethod: "student_id", webcam: true, screenMonitor: false,
  audioMonitor: false, aiProctoring: false,
  detectTabSwitch: true, detectMultiScreen: true, detectMultiFace: false, detectSuspicious: true,
  randomizeQuestions: true, randomizeAnswers: true, candidateSpecificSets: false,
  extraTime: false, extraTimeMinutes: 30, largeText: false, highContrast: false, screenReader: false,
  instructions: "", materialsAllowed: "", prohibited: "", submissionGuidelines: "", technicalRequirements: "",
  publishOption: "draft",
};

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { num: 1,  label: "Basic Information",   icon: FileText },
  { num: 2,  label: "Candidate Selection", icon: Users },
  { num: 3,  label: "Question Config",     icon: BookOpen },
  { num: 4,  label: "Exam Structure",      icon: Layers2 },
  { num: 5,  label: "Marking Scheme",      icon: Target },
  { num: 6,  label: "Schedule",            icon: Calendar },
  { num: 7,  label: "Security",            icon: Shield },
  { num: 8,  label: "Randomization",       icon: RotateCcw },
  { num: 9,  label: "Accessibility",       icon: Eye },
  { num: 10, label: "Instructions",        icon: FileText },
  { num: 11, label: "Review",              icon: CheckCircle2 },
  { num: 12, label: "Publish",             icon: Send },
];

// Simple icon sub for Layers2 (not in current import)
function Layers2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m16.02 12 5.48 3.13a1 1 0 0 1 0 1.74L13 21a2 2 0 0 1-2 0L2.5 16.87a1 1 0 0 1 0-1.74L8 12" />
      <path d="M13 13a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 3a2 2 0 0 1 2 0l8.5 4.13a1 1 0 0 1 0 1.74Z" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-medium border transition",
        active
          ? "border-transparent text-white"
          : "border-border bg-background text-muted-foreground hover:text-foreground",
      )}
      style={active ? { background: NAVY } : undefined}
    >
      {label}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
        checked ? "bg-[oklch(0.385_0.12_247)]" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function FormRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:items-start">
      <div className="sm:pt-2">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-background p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const examTypes = [
    "Quiz", "Assignment", "Mid-Semester Exam", "End-of-Semester Exam",
    "Entrance Exam", "Certification Exam", "Practice Exam", "Mock Exam", "Assessment Test",
  ];
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Examination Details</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Examination Title <span className="text-rose-500">*</span></Label>
              <Input value={s.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. CS101 Final Examination" />
            </div>
            <div className="space-y-1.5">
              <Label>Examination Code</Label>
              <Input value={s.code} onChange={(e) => set({ code: e.target.value })} placeholder="e.g. CS101-F2026" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Academic Year</Label>
              <Input value={s.academicYear} onChange={(e) => set({ academicYear: e.target.value })} placeholder="2025/2026" />
            </div>
            <div className="space-y-1.5">
              <Label>Semester</Label>
              <select
                value={s.semester}
                onChange={(e) => set({ semester: e.target.value })}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">Select semester</option>
                {["First Semester", "Second Semester", "Summer Session", "Full Year"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input value={s.department} onChange={(e) => set({ department: e.target.value })} placeholder="e.g. Computer Science" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Faculty</Label>
              <Input value={s.faculty} onChange={(e) => set({ faculty: e.target.value })} placeholder="e.g. Faculty of Engineering" />
            </div>
            <div className="space-y-1.5">
              <Label>Program</Label>
              <Input value={s.program} onChange={(e) => set({ program: e.target.value })} placeholder="e.g. B.Sc. Computer Science" />
            </div>
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Input value={s.course} onChange={(e) => set({ course: e.target.value })} placeholder="e.g. Data Structures" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={s.subject} onChange={(e) => set({ subject: e.target.value })} placeholder="e.g. Algorithms" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Examination Description</Label>
            <textarea
              value={s.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={3}
              placeholder="Describe the purpose and scope of this examination…"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Examination Type</h3>
        <div className="flex flex-wrap gap-2">
          {examTypes.map((t) => (
            <ToggleChip key={t} label={t} active={s.examType === t} onClick={() => set({ examType: t })} />
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Examination Mode</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "online",   label: "Online",   icon: MonitorSmartphone, desc: "Fully online proctored exam" },
            { id: "physical", label: "Physical", icon: FileText,          desc: "On-site physical exam" },
            { id: "hybrid",   label: "Hybrid",   icon: Cpu,               desc: "Mix of online and physical" },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => set({ examMode: m.id })}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition",
                  s.examMode === m.id ? "border-[oklch(0.385_0.12_247)] bg-blue-50/30" : "border-border hover:border-foreground/30",
                )}
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

function Step2({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const methods = [
    { id: "institution", label: "Entire Institution",   desc: "All enrolled candidates" },
    { id: "faculty",     label: "By Faculty",           desc: "Filter by faculty" },
    { id: "department",  label: "By Department",        desc: "Filter by department" },
    { id: "program",     label: "By Program",           desc: "Filter by academic program" },
    { id: "course",      label: "By Course",            desc: "Specific course enrolees" },
    { id: "class",       label: "By Class",             desc: "Specific class group" },
    { id: "individual",  label: "Individual Students",  desc: "Manually select candidates" },
  ];
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Selection Method</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => set({ candidateMethod: m.id })}
              className={cn(
                "rounded-xl border-2 p-3 text-left transition",
                s.candidateMethod === m.id ? "border-[oklch(0.385_0.12_247)] bg-blue-50/30" : "border-border hover:border-foreground/30",
              )}
            >
              <p className={cn("text-sm font-medium", s.candidateMethod === m.id ? "text-[oklch(0.385_0.12_247)]" : "")}>{m.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{m.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      {(s.candidateMethod === "faculty") && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold">Faculty Filter</h3>
          <Input value={s.selectedFaculty} onChange={(e) => set({ selectedFaculty: e.target.value })} placeholder="Enter faculty name" />
        </Card>
      )}
      {(s.candidateMethod === "department") && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold">Department Filter</h3>
          <Input value={s.selectedDept} onChange={(e) => set({ selectedDept: e.target.value })} placeholder="Enter department name" />
        </Card>
      )}

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Candidate Controls</h3>
        <div className="grid grid-cols-3 gap-3">
          {["Manual Selection", "Bulk Upload", "Dynamic Enrollment"].map((c) => (
            <div key={c} className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <p className="text-sm font-medium">{c}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {c === "Manual Selection" ? "Choose candidates one by one"
                  : c === "Bulk Upload" ? "Upload CSV of student IDs"
                  : "Auto-enroll based on course data"}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Candidate Count",      value: "—",  cls: "text-foreground" },
          { label: "Eligible Candidates",  value: "—",  cls: "text-emerald-700" },
          { label: "Ineligible Candidates",value: "—",  cls: "text-rose-700" },
        ].map((c) => (
          <Card key={c.label} className="text-center">
            <p className={cn("text-3xl font-bold tabular-nums", c.cls)}>{c.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Populated after candidate sync</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Step3({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const sources = [
    { id: "bank",   label: "Question Bank",     desc: "Pick from existing questions" },
    { id: "manual", label: "Manual Creation",   desc: "Write questions from scratch" },
    { id: "ai",     label: "AI Generated",      desc: "Generate with AI assistance" },
    { id: "import", label: "Imported Questions",desc: "Import from file" },
  ];
  const qTypes = [
    { id: "mcq",         label: "Multiple Choice"   },
    { id: "multi_resp",  label: "Multiple Response" },
    { id: "true_false",  label: "True / False"      },
    { id: "fill_blank",  label: "Fill in the Blank" },
    { id: "matching",    label: "Matching"           },
    { id: "short_answer",label: "Short Answer"       },
    { id: "essay",       label: "Essay"              },
    { id: "numerical",   label: "Numerical"          },
    { id: "coding",      label: "Coding Question"    },
    { id: "file_upload", label: "File Upload"        },
  ];
  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const total = s.difficultyEasy + s.difficultyMedium + s.difficultyHard;

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Question Sources</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sources.map((src) => (
            <button
              key={src.id}
              type="button"
              onClick={() => set({ questionSources: toggleArr(s.questionSources, src.id) })}
              className={cn(
                "rounded-xl border-2 p-3 text-left transition",
                s.questionSources.includes(src.id) ? "border-[oklch(0.385_0.12_247)] bg-blue-50/30" : "border-border hover:border-foreground/30",
              )}
            >
              <p className="text-sm font-medium">{src.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{src.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Question Types</h3>
        <div className="flex flex-wrap gap-2">
          {qTypes.map((t) => (
            <ToggleChip
              key={t.id}
              label={t.label}
              active={s.questionTypes.includes(t.id)}
              onClick={() => set({ questionTypes: toggleArr(s.questionTypes, t.id) })}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Question Selection Rules</h3>
        <div className="space-y-4">
          <FormRow label="Total Questions">
            <Input
              type="number" min={1} max={500}
              value={s.totalQuestions}
              onChange={(e) => set({ totalQuestions: +e.target.value })}
              className="w-32"
            />
          </FormRow>
          <FormRow label="Random Selection" hint="Randomly pick questions from the bank">
            <Toggle checked={s.randomSelection} onChange={(v) => set({ randomSelection: v })} />
          </FormRow>
          <FormRow label="Question Pooling" hint="Use question pools per section">
            <Toggle checked={s.pooling} onChange={(v) => set({ pooling: v })} />
          </FormRow>
          <FormRow label="Difficulty Balance" hint={`Total: ${total}% (should equal 100%)`}>
            <div className="flex flex-wrap gap-4">
              {[
                { key: "difficultyEasy",   label: "Easy",   color: "text-emerald-700" },
                { key: "difficultyMedium", label: "Medium", color: "text-amber-700" },
                { key: "difficultyHard",   label: "Hard",   color: "text-rose-700" },
              ].map((d) => (
                <div key={d.key} className="flex items-center gap-2">
                  <span className={cn("text-xs font-medium w-12", d.color)}>{d.label}</span>
                  <Input
                    type="number" min={0} max={100}
                    value={(s as any)[d.key]}
                    onChange={(e) => set({ [d.key]: +e.target.value } as any)}
                    className="w-20"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              ))}
            </div>
            {total !== 100 && (
              <p className="mt-1 text-xs text-amber-600">
                <AlertTriangle className="mr-1 inline h-3 w-3" />
                Difficulty percentages should sum to 100% (currently {total}%)
              </p>
            )}
          </FormRow>
        </div>
      </Card>
    </div>
  );
}

function Step4({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const qTypeOptions = [
    "mcq", "true_false", "short_answer", "essay", "coding", "numerical", "file_upload",
  ];

  const addSection = () => set({
    sections: [...s.sections, {
      id: crypto.randomUUID(),
      title: `Section ${String.fromCharCode(65 + s.sections.length)}`,
      type: "mcq", questionCount: 10, marks: 10,
      mandatory: true, randomize: false, timeLimitMinutes: null,
    }],
  });

  const updateSection = (id: string, patch: Partial<Section>) =>
    set({ sections: s.sections.map((sec) => sec.id === id ? { ...sec, ...patch } : sec) });

  const removeSection = (id: string) =>
    set({ sections: s.sections.filter((sec) => sec.id !== id) });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Exam Sections</h3>
          <p className="text-sm text-muted-foreground">
            Total marks: {s.sections.reduce((a, sec) => a + sec.marks, 0)} ·
            Total questions: {s.sections.reduce((a, sec) => a + sec.questionCount, 0)}
          </p>
        </div>
        <Button size="sm" onClick={addSection} className="gap-1.5 text-white" style={{ background: NAVY }}>
          <Plus className="h-4 w-4" /> Add Section
        </Button>
      </div>

      {s.sections.map((sec, i) => (
        <Card key={sec.id}>
          <div className="mb-4 flex items-center gap-3">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              Section {String.fromCharCode(65 + i)}
            </span>
            <div className="flex-1">
              <Input
                value={sec.title}
                onChange={(e) => updateSection(sec.id, { title: e.target.value })}
                className="h-8 text-sm font-semibold"
              />
            </div>
            {s.sections.length > 1 && (
              <button
                onClick={() => removeSection(sec.id)}
                className="rounded-md p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Question Type</Label>
              <select
                value={sec.type}
                onChange={(e) => updateSection(sec.id, { type: e.target.value })}
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
              >
                {qTypeOptions.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Questions</Label>
              <Input
                type="number" min={1}
                value={sec.questionCount}
                onChange={(e) => updateSection(sec.id, { questionCount: +e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Total Marks</Label>
              <Input
                type="number" min={0}
                value={sec.marks}
                onChange={(e) => updateSection(sec.id, { marks: +e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Time Limit (min)</Label>
              <Input
                type="number" min={0}
                value={sec.timeLimitMinutes ?? ""}
                placeholder="No limit"
                onChange={(e) => updateSection(sec.id, { timeLimitMinutes: e.target.value ? +e.target.value : null })}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-6">
            <label className="flex items-center gap-2 text-xs">
              <Toggle checked={sec.mandatory} onChange={(v) => updateSection(sec.id, { mandatory: v })} />
              Mandatory
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Toggle checked={sec.randomize} onChange={(v) => updateSection(sec.id, { randomize: v })} />
              Randomize questions
            </label>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Step5({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const updateBoundary = (i: number, patch: Partial<GradeBoundary>) =>
    set({ gradeBoundaries: s.gradeBoundaries.map((b, idx) => idx === i ? { ...b, ...patch } : b) });

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Scoring</h3>
        <div className="space-y-4">
          <FormRow label="Marks Per Question">
            <Input
              type="number" min={0.5} step={0.5}
              value={s.marksPerQuestion}
              onChange={(e) => set({ marksPerQuestion: +e.target.value })}
              className="w-28"
            />
          </FormRow>
          <FormRow label="Negative Marking">
            <div className="flex items-center gap-3">
              <Toggle checked={s.negativeMarking} onChange={(v) => set({ negativeMarking: v })} />
              {s.negativeMarking && (
                <div className="flex items-center gap-2 text-xs">
                  <span>Deduct</span>
                  <Input
                    type="number" min={0} max={s.marksPerQuestion} step={0.25}
                    value={s.negativeValue}
                    onChange={(e) => set({ negativeValue: +e.target.value })}
                    className="h-7 w-20 text-xs"
                  />
                  <span>marks per wrong answer</span>
                </div>
              )}
            </div>
          </FormRow>
          <FormRow label="Bonus Marks">
            <Toggle checked={s.bonusMarks} onChange={(v) => set({ bonusMarks: v })} />
          </FormRow>
          <FormRow label="Partial Credit" hint="Award partial marks for partially correct answers">
            <Toggle checked={s.partialCredit} onChange={(v) => set({ partialCredit: v })} />
          </FormRow>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Grading System</h3>
        <div className="flex flex-wrap gap-2">
          {["percentage", "gpa", "letter", "pass_fail"].map((gs) => (
            <ToggleChip
              key={gs}
              label={gs === "pass_fail" ? "Pass / Fail" : gs.charAt(0).toUpperCase() + gs.slice(1)}
              active={s.gradingSystem === gs}
              onClick={() => set({ gradingSystem: gs })}
            />
          ))}
        </div>
      </Card>

      {s.gradingSystem !== "pass_fail" && (
        <Card>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Grade Boundaries</h3>
          <div className="space-y-2">
            {s.gradeBoundaries.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <Input
                  value={b.label}
                  onChange={(e) => updateBoundary(i, { label: e.target.value })}
                  className="h-8 w-16 text-center text-sm font-semibold"
                  placeholder="A"
                />
                <span className="text-xs text-muted-foreground">=</span>
                <Input
                  type="number" min={0} max={100}
                  value={b.min}
                  onChange={(e) => updateBoundary(i, { min: +e.target.value })}
                  className="h-8 w-20 text-xs"
                />
                <span className="text-xs text-muted-foreground">–</span>
                <Input
                  type="number" min={0} max={100}
                  value={b.max}
                  onChange={(e) => updateBoundary(i, { max: +e.target.value })}
                  className="h-8 w-20 text-xs"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Step6({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Scheduling</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Exam Date</Label>
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
          </div>
          <FormRow label="Duration (minutes)">
            <Input
              type="number" min={5}
              value={s.duration}
              onChange={(e) => set({ duration: +e.target.value })}
              className="w-28"
            />
          </FormRow>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Availability Rules</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "fixed",    label: "Fixed Window",    desc: "Exam opens and closes at set times" },
            { id: "flexible", label: "Flexible Window", desc: "Candidates can start within a window" },
            { id: "sessions", label: "Multiple Sessions",desc: "Multiple time slots available" },
          ].map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => set({ windowType: w.id })}
              className={cn(
                "rounded-xl border-2 p-3 text-left transition",
                s.windowType === w.id ? "border-[oklch(0.385_0.12_247)] bg-blue-50/30" : "border-border hover:border-foreground/30",
              )}
            >
              <p className="text-sm font-medium">{w.label}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{w.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Time Controls</h3>
        <div className="space-y-4">
          <FormRow label="Auto Submission" hint="Automatically submit when time expires">
            <Toggle checked={s.autoSubmit} onChange={(v) => set({ autoSubmit: v })} />
          </FormRow>
          <FormRow label="Late Submission" hint="Allow submission after time expires">
            <Toggle checked={s.lateSubmission} onChange={(v) => set({ lateSubmission: v })} />
          </FormRow>
          {(s.lateSubmission) && (
            <FormRow label="Grace Period (minutes)">
              <Input
                type="number" min={0}
                value={s.gracePeriod}
                onChange={(e) => set({ gracePeriod: +e.target.value })}
                className="w-28"
              />
            </FormRow>
          )}
        </div>
      </Card>
    </div>
  );
}

function Step7({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const browserRestrictions = [
    { key: "secFullScreen",        label: "Full Screen Mode",          desc: "Force full screen during exam" },
    { key: "secDisableCopy",       label: "Disable Copy",              desc: "Block Ctrl+C and right-click copy" },
    { key: "secDisablePaste",      label: "Disable Paste",             desc: "Block Ctrl+V paste actions" },
    { key: "secDisablePrint",      label: "Disable Printing",          desc: "Block Ctrl+P print actions" },
    { key: "secDisableScreenshot", label: "Disable Screenshot Shortcuts", desc: "Block PrtScr and snipping tools" },
    { key: "secDisableDevTools",   label: "Disable Developer Tools",   desc: "Block F12 and devtools access" },
  ];
  const proctoringOptions = [
    { key: "webcam",        label: "Webcam Monitoring",   icon: Eye },
    { key: "screenMonitor", label: "Screen Monitoring",   icon: MonitorSmartphone },
    { key: "audioMonitor",  label: "Audio Monitoring",    icon: Cpu },
    { key: "aiProctoring",  label: "AI Proctoring",       icon: Sparkles },
  ];
  const violationDetection = [
    { key: "detectTabSwitch",    label: "Tab Switching",     desc: "Flag when candidate switches tabs" },
    { key: "detectMultiScreen",  label: "Multiple Screens",  desc: "Detect external display connections" },
    { key: "detectMultiFace",    label: "Multiple Faces",    desc: "Detect additional faces in webcam feed" },
    { key: "detectSuspicious",   label: "Suspicious Activity", desc: "AI-based behavioral anomaly detection" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Browser Restrictions</h3>
        <div className="space-y-3">
          {browserRestrictions.map((r) => (
            <div key={r.key} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <Toggle checked={(s as any)[r.key]} onChange={(v) => set({ [r.key]: v } as any)} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Candidate Verification</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "password",   label: "Password Access" },
            { id: "pin",        label: "PIN Access" },
            { id: "student_id", label: "Student ID Verification" },
            { id: "face",       label: "Face Verification" },
          ].map((v) => (
            <ToggleChip
              key={v.id}
              label={v.label}
              active={s.verificationMethod === v.id}
              onClick={() => set({ verificationMethod: v.id })}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Proctoring</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {proctoringOptions.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => set({ [p.key]: !(s as any)[p.key] } as any)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition",
                  (s as any)[p.key] ? "border-[oklch(0.385_0.12_247)] bg-blue-50/30" : "border-border hover:border-foreground/30",
                )}
              >
                <Icon className={cn("h-5 w-5", (s as any)[p.key] ? "text-[oklch(0.385_0.12_247)]" : "text-muted-foreground")} />
                <span className="text-xs font-medium text-center">{p.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Violation Detection</h3>
        <div className="space-y-3">
          {violationDetection.map((v) => (
            <div key={v.key} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">{v.label}</p>
                <p className="text-xs text-muted-foreground">{v.desc}</p>
              </div>
              <Toggle checked={(s as any)[v.key]} onChange={(val) => set({ [v.key]: val } as any)} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Step8({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const items = [
    { key: "randomizeQuestions",   label: "Question Randomization",          desc: "Each candidate receives questions in a different order" },
    { key: "randomizeAnswers",     label: "Answer Randomization",            desc: "Shuffle MCQ answer options per candidate" },
    { key: "candidateSpecificSets",label: "Candidate-Specific Question Sets", desc: "Generate unique question sets per candidate from the pool" },
  ];
  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Randomization Settings</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <Toggle checked={(s as any)[item.key]} onChange={(v) => set({ [item.key]: v } as any)} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function Step9({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Accessibility Settings</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">Extra Time</p>
              <p className="text-xs text-muted-foreground">Grant additional time for eligible candidates</p>
            </div>
            <Toggle checked={s.extraTime} onChange={(v) => set({ extraTime: v })} />
          </div>
          {s.extraTime && (
            <div className="rounded-lg border border-border p-4">
              <Label className="text-xs">Extra time (minutes)</Label>
              <Input
                type="number" min={5}
                value={s.extraTimeMinutes}
                onChange={(e) => set({ extraTimeMinutes: +e.target.value })}
                className="mt-1.5 w-28"
              />
            </div>
          )}
          {[
            { key: "largeText",    label: "Large Text Mode",          desc: "Increase font size for readability" },
            { key: "highContrast", label: "High Contrast Mode",       desc: "Enhanced contrast for visual impairment" },
            { key: "screenReader", label: "Screen Reader Compatibility", desc: "Ensure full ARIA compatibility" },
          ].map((a) => (
            <div key={a.key} className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
              <Toggle checked={(s as any)[a.key]} onChange={(v) => set({ [a.key]: v } as any)} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Step10({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const fields = [
    { key: "instructions",         label: "Exam Instructions",          rows: 6,  placeholder: "Write the main examination instructions here. Include any important rules candidates must follow…" },
    { key: "materialsAllowed",     label: "Materials Allowed",          rows: 3,  placeholder: "e.g. Calculator, Open book, Scratch paper…" },
    { key: "prohibited",           label: "Prohibited Activities",      rows: 3,  placeholder: "e.g. No mobile phones, No external websites, No communication with others…" },
    { key: "submissionGuidelines", label: "Submission Guidelines",      rows: 3,  placeholder: "e.g. Review all answers before submitting, Ensure all questions are answered…" },
    { key: "technicalRequirements",label: "Technical Requirements",     rows: 3,  placeholder: "e.g. Stable internet connection required, Chrome browser recommended, Webcam must be enabled…" },
  ];
  return (
    <div className="space-y-5">
      {fields.map((f) => (
        <Card key={f.key}>
          <Label className="mb-2 block text-sm font-semibold">{f.label}</Label>
          <textarea
            value={(s as any)[f.key]}
            onChange={(e) => set({ [f.key]: e.target.value } as any)}
            rows={f.rows}
            placeholder={f.placeholder}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-y"
          />
        </Card>
      ))}
    </div>
  );
}

interface ValidationIssue { type: "error" | "warning" | "suggestion"; message: string; }

function validateWizard(s: WizardState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!s.title.trim()) issues.push({ type: "error", message: "Examination title is required." });
  if (!s.examType) issues.push({ type: "error", message: "Examination type must be selected." });
  if (s.sections.length === 0) issues.push({ type: "error", message: "At least one section is required." });
  if (s.sections.some((sec) => sec.questionCount < 1)) issues.push({ type: "error", message: "All sections must have at least 1 question." });
  if (s.sections.some((sec) => sec.marks < 1)) issues.push({ type: "warning", message: "Some sections have 0 marks assigned." });
  if (!s.examDate) issues.push({ type: "warning", message: "No exam date set. The exam cannot be scheduled." });
  if (s.examDate && s.startTime && s.endTime && s.startTime >= s.endTime) {
    issues.push({ type: "error", message: "End time must be after start time." });
  }
  if (s.examDate) {
    const dt = new Date(s.examDate + "T" + (s.startTime || "00:00"));
    if (dt < new Date()) issues.push({ type: "warning", message: "Exam date/time is in the past." });
  }
  if (s.difficultyEasy + s.difficultyMedium + s.difficultyHard !== 100) {
    issues.push({ type: "warning", message: "Difficulty balance percentages do not sum to 100%." });
  }
  const totalSectionMarks = s.sections.reduce((a, sec) => a + sec.marks, 0);
  if (totalSectionMarks === 0) issues.push({ type: "warning", message: "Total exam marks are 0." });
  if (!s.instructions.trim()) issues.push({ type: "suggestion", message: "Consider adding exam instructions for candidates." });
  if (!s.webcam && s.examMode === "online") issues.push({ type: "suggestion", message: "Webcam monitoring is disabled for an online exam." });
  return issues;
}

function Step11({ s }: { s: WizardState }) {
  const issues = validateWizard(s);
  const errors = issues.filter((i) => i.type === "error");
  const warnings = issues.filter((i) => i.type === "warning");
  const suggestions = issues.filter((i) => i.type === "suggestion");

  return (
    <div className="space-y-5">
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Validation Summary</h3>
        {issues.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">All checks passed</p>
              <p className="text-xs mt-0.5">Your examination is ready to publish.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Errors ({errors.length})</p>
                {errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {e.message}
                  </div>
                ))}
              </div>
            )}
            {warnings.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Warnings ({warnings.length})</p>
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    {w.message}
                  </div>
                ))}
              </div>
            )}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Suggestions ({suggestions.length})</p>
                {suggestions.map((su, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-sky-50 p-3 text-xs text-sky-700">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    {su.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Configuration Summary</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ["Title",         s.title || "—"],
            ["Type",          s.examType || "—"],
            ["Mode",          s.examMode],
            ["Sections",      String(s.sections.length)],
            ["Total Marks",   String(s.sections.reduce((a, sec) => a + sec.marks, 0))],
            ["Total Questions",String(s.sections.reduce((a, sec) => a + sec.questionCount, 0))],
            ["Duration",      s.duration + " minutes"],
            ["Exam Date",     s.examDate || "Not set"],
            ["Grading",       s.gradingSystem],
            ["Proctoring",    [s.webcam && "Webcam", s.aiProctoring && "AI", s.screenMonitor && "Screen"].filter(Boolean).join(", ") || "None"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-right">{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Step12({ s, set, onPublish, isPublishing }: {
  s: WizardState;
  set: (p: Partial<WizardState>) => void;
  onPublish: () => void;
  isPublishing: boolean;
}) {
  const errors = validateWizard(s).filter((i) => i.type === "error");
  const options = [
    { id: "draft",     label: "Save as Draft",     icon: Save,      desc: "Visible only to admins. Exam is not accessible to candidates.", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { id: "scheduled", label: "Schedule",           icon: Calendar,  desc: "Automatically opens at the specified date and time.", color: "text-sky-700 bg-sky-50 border-sky-200" },
    { id: "immediate", label: "Publish Now",        icon: Zap,       desc: "Make the exam live immediately.", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { id: "private",   label: "Private (Invite Only)", icon: Lock,  desc: "Available only through direct invitation link.", color: "text-violet-700 bg-violet-50 border-violet-200" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Publishing Options</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => set({ publishOption: opt.id })}
                className={cn(
                  "flex items-start gap-3 rounded-xl border-2 p-4 text-left transition",
                  s.publishOption === opt.id ? "border-[oklch(0.385_0.12_247)] bg-blue-50/30" : "border-border hover:border-foreground/30",
                )}
              >
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", opt.color)}>
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
            <XCircle className="h-4 w-4" />
            <p className="text-sm font-semibold">Cannot publish — {errors.length} error{errors.length > 1 ? "s" : ""} must be resolved first</p>
          </div>
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-rose-700 ml-6">{e.message}</p>
          ))}
        </div>
      )}

      <Button
        className="w-full gap-2 text-white h-12 text-base"
        style={{ background: NAVY }}
        onClick={onPublish}
        disabled={isPublishing || errors.length > 0}
      >
        {isPublishing ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Creating Examination…</>
        ) : (
          <><Send className="h-5 w-5" /> {s.publishOption === "draft" ? "Save as Draft" : s.publishOption === "immediate" ? "Publish Now" : s.publishOption === "scheduled" ? "Schedule Examination" : "Publish as Private"}</>
        )}
      </Button>
    </div>
  );
}

// ─── AI Assistant Panel ───────────────────────────────────────────────────────

const AI_TIPS: Record<number, string[]> = {
  1:  ["Use a clear, specific title — include course code and semester.", "Set the examination code to match your institution's naming convention.", "Select the correct exam type to ensure proper grading rules are applied."],
  2:  ["Department-level selection is the most common for institutional exams.", "Use Dynamic Enrollment to auto-sync with your SIS for real-time candidate updates.", "Review eligible vs. ineligible counts before proceeding."],
  3:  ["A 40/40/20 easy/medium/hard split is recommended for end-of-semester exams.", "Enable question pooling for large cohorts to reduce academic dishonesty.", "Random selection ensures exam integrity across candidates."],
  4:  ["Section A for MCQ, Section B for short answer, and Section C for essays is a standard structure.", "Set per-section time limits for longer exams to keep candidates on track.", "Ensure total marks across sections match your grading rubric."],
  5:  ["Negative marking of 0.25 per wrong MCQ answer discourages random guessing.", "Use Pass/Fail grading for certification exams.", "Partial credit works best for numerical and coding questions."],
  6:  ["Schedule exams at least 48 hours in advance to allow candidate preparation.", "Fixed window prevents candidates from starting late, reducing timing variability.", "Enable auto-submission to prevent unfair extra time."],
  7:  ["Full-screen mode and tab-switch detection are the minimum recommended security.", "AI proctoring is recommended for high-stakes certification exams.", "Webcam monitoring should be enabled for any exam where identity matters."],
  8:  ["Question randomization is essential for large cohorts sharing a hall.", "Candidate-specific sets provide the strongest anti-cheating protection.", "Answer randomization prevents pattern memorization."],
  9:  ["Offer extra time for candidates with documented accessibility needs.", "High contrast and large text should be opt-in at the candidate level.", "Screen reader compatibility ensures WCAG 2.1 compliance."],
  10: ["Keep instructions concise and numbered for easy reading during exam.", "Clearly list prohibited materials to avoid disputes.", "Specify technical requirements to reduce technical support load."],
  11: ["Resolve all errors before proceeding to publish.", "Warnings indicate configuration gaps — review each one.", "Run a test attempt after publishing to verify the exam flow."],
  12: ["Save as Draft to complete question configuration in the builder before publishing.", "Schedule the exam to automate opening — no manual action needed.", "Share the private link only with registered candidates."],
};

function AIAssistant({ step, onClose }: { step: number; onClose: () => void }) {
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
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Step {step} Recommendations</p>
        {tips.map((tip, i) => (
          <div key={i} className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-foreground/80">
            <span className="mr-1.5 font-bold" style={{ color: NAVY }}>•</span>
            {tip}
          </div>
        ))}
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-xs font-semibold mb-1">Predicted Exam Duration</p>
          <p className="text-xs text-muted-foreground">
            Based on your configuration, candidates will likely need{" "}
            <span className="font-semibold text-foreground">~60–90 minutes</span>.
          </p>
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
      return saved ? { ...INITIAL_STATE, ...JSON.parse(saved) } : INITIAL_STATE;
    } catch { return INITIAL_STATE; }
  });
  const [showAI, setShowAI] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const set = useCallback((patch: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  // Auto-save to localStorage every 10s
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

      // Create exam
      const { data: exam, error: examErr } = await supabase
        .from("exams")
        .insert({
          title: state.title.trim(),
          term: state.semester ? `${state.academicYear} ${state.semester}`.trim() : (state.academicYear || null),
          status,
          created_by: user.id,
        })
        .select("id")
        .single();
      if (examErr || !exam) throw examErr ?? new Error("Failed to create exam");

      // Create sections
      const sections = state.sections.map((sec, i) => ({
        exam_id: exam.id,
        title: sec.title,
        position: i,
        time_limit_minutes: sec.timeLimitMinutes,
      }));
      if (sections.length > 0) {
        const { error: secErr } = await supabase.from("exam_sections").insert(sections);
        if (secErr) throw secErr;
      }

      // Create schedule if date is set
      if (state.examDate && state.startTime) {
        const startAt = new Date(`${state.examDate}T${state.startTime}`).toISOString();
        const endAt = state.endTime
          ? new Date(`${state.examDate}T${state.endTime}`).toISOString()
          : new Date(new Date(`${state.examDate}T${state.startTime}`).getTime() + state.duration * 60_000).toISOString();

        await supabase.from("exam_schedules").insert({
          exam_id: exam.id,
          organization_id: null,
          created_by: user.id,
          start_at: startAt,
          end_at: endAt,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          max_concurrent: 0,
          notify_confirmation: false,
          notify_proctors: false,
          notify_reminder: false,
          waitlist_enabled: false,
        });
      }

      // Clear draft after successful publish
      localStorage.removeItem(STORAGE_KEY);
      return exam.id;
    },
    onSuccess: (examId) => {
      toast.success(
        state.publishOption === "immediate" ? "Examination published!" : "Examination saved as draft.",
        { description: "Opening the question builder…" }
      );
      navigate({ to: "/admin/exams/$examId/builder", params: { examId } });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create examination."),
  });

  const canProceed = () => {
    if (step === 1) return !!state.title.trim() && !!state.examType;
    return true;
  };

  // Step11 and Step12 are rendered with custom props below; exclude from generic array
  const StepContent = [null, Step1, Step2, Step3, Step4, Step5, Step6, Step7, Step8, Step9, Step10, null, null][step];

  return (
    <AdminShell
      title="New Examination"
      breadcrumbs={[{ label: "Exams", to: "/admin/exams" }, { label: "New Examination" }]}
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex gap-6">
          {/* Step sidebar */}
          <div className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-6 space-y-1">
              {STEPS.map((s_) => {
                const Icon = s_.icon;
                const done = s_.num < step;
                const active = s_.num === step;
                return (
                  <button
                    key={s_.num}
                    onClick={() => s_.num < step && setStep(s_.num)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition",
                      active ? "text-white" : done ? "text-muted-foreground hover:bg-muted" : "text-muted-foreground/60 cursor-default",
                    )}
                    style={active ? { background: NAVY } : undefined}
                  >
                    <div className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      active ? "bg-white/20 text-white" : done ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground",
                    )}>
                      {done ? <Check className="h-3 w-3" /> : s_.num}
                    </div>
                    <span className="truncate">{s_.label}</span>
                  </button>
                );
              })}
              <div className="mt-4 border-t border-border pt-4">
                <button
                  onClick={() => {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                    setLastSaved(new Date());
                    toast.success("Draft saved.");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
                >
                  <Save className="h-3.5 w-3.5" />
                  {lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Save Draft"}
                </button>
                <button
                  onClick={() => setShowAI(!showAI)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Assistant
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
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex h-2 w-40 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(step / STEPS.length) * 100}%`, background: NAVY }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{Math.round((step / STEPS.length) * 100)}%</span>
              </div>
            </div>

            {StepContent && (
              step === 11 ? <Step11 s={state} /> :
              step === 12 ? (
                <Step12
                  s={state}
                  set={set}
                  onPublish={() => publishMutation.mutate()}
                  isPublishing={publishMutation.isPending}
                />
              ) : (
                <StepContent s={state} set={set} />
              )
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
              <Button
                variant="outline"
                onClick={() => step > 1 ? setStep(step - 1) : navigate({ to: "/admin/exams" })}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                {step === 1 ? "Cancel" : "Back"}
              </Button>
              {step < STEPS.length && (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="gap-1.5 text-white"
                  style={{ background: NAVY }}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* AI Panel */}
          {showAI && (
            <div className="hidden w-72 shrink-0 xl:block">
              <div className="sticky top-6">
                <AIAssistant step={step} onClose={() => setShowAI(false)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
