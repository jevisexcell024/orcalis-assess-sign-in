import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search, Plus, Download, UserCheck, BookOpen,
  GraduationCap, FileText, ChevronDown,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/students")({
  component: StudentsPage,
  head: () => ({ meta: [{ title: "Students (SIS) · Orcalis Assess" }] }),
});

// Mock data until students table is populated via migration
const MOCK_STUDENTS = [
  { id: "1", student_number: "STU-2024-001", full_name: "Amara Osei",      department: "Computer Science",  program: "BSc CS",       year_of_study: 3, enrollment_status: "active",    gpa: 3.8 },
  { id: "2", student_number: "STU-2024-002", full_name: "James Kwame",     department: "Engineering",        program: "BEng Civil",   year_of_study: 2, enrollment_status: "active",    gpa: 3.5 },
  { id: "3", student_number: "STU-2024-003", full_name: "Fatima Al-Hassan", department: "Business",          program: "MBA",          year_of_study: 1, enrollment_status: "active",    gpa: 3.9 },
  { id: "4", student_number: "STU-2023-044", full_name: "David Mensah",    department: "Medicine",           program: "MBBS",         year_of_study: 4, enrollment_status: "active",    gpa: 3.2 },
  { id: "5", student_number: "STU-2023-101", full_name: "Esi Boateng",     department: "Law",                program: "LLB",          year_of_study: 2, enrollment_status: "suspended", gpa: 2.8 },
  { id: "6", student_number: "STU-2022-077", full_name: "Kofi Asante",     department: "Computer Science",   program: "MSc Data Sci", year_of_study: 2, enrollment_status: "graduated", gpa: 3.7 },
];

const STATUS_CLS: Record<string, string> = {
  active:    "bg-emerald-50 text-emerald-700 ring-emerald-200",
  suspended: "bg-rose-50 text-rose-700 ring-rose-200",
  graduated: "bg-sky-50 text-sky-700 ring-sky-200",
  withdrawn: "bg-slate-100 text-slate-500 ring-slate-200",
  deferred:  "bg-amber-50 text-amber-700 ring-amber-200",
};

function StudentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  const departments = useMemo(() => Array.from(new Set(MOCK_STUDENTS.map((s) => s.department))), []);

  const filtered = useMemo(() => MOCK_STUDENTS.filter((s) => {
    const matchSearch = !search ||
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.enrollment_status === statusFilter;
    const matchDept = deptFilter === "all" || s.department === deptFilter;
    return matchSearch && matchStatus && matchDept;
  }), [search, statusFilter, deptFilter]);

  const stats = useMemo(() => ({
    total: MOCK_STUDENTS.length,
    active: MOCK_STUDENTS.filter((s) => s.enrollment_status === "active").length,
    graduated: MOCK_STUDENTS.filter((s) => s.enrollment_status === "graduated").length,
    avgGpa: (MOCK_STUDENTS.reduce((s, r) => s + r.gpa, 0) / MOCK_STUDENTS.length).toFixed(2),
  }), []);

  return (
    <AdminShell
      title="Student Information System"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Students" }]}
    >
      <div className="mx-auto w-full max-w-[1300px] space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Students", value: stats.total,    icon: UserCheck,     cls: "text-foreground"  },
            { label: "Active",         value: stats.active,   icon: BookOpen,      cls: "text-emerald-700" },
            { label: "Graduated",      value: stats.graduated,icon: GraduationCap, cls: "text-sky-700"     },
            { label: "Avg GPA",        value: stats.avgGpa,   icon: FileText,      cls: "text-violet-700"  },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className={cn("mt-1 text-2xl font-bold tabular-nums", s.cls)}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or student ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-9" />
          </div>
          <div className="relative">
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-background pl-3 pr-8 text-sm appearance-none cursor-pointer">
              <option value="all">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-background pl-3 pr-8 text-sm appearance-none cursor-pointer">
              <option value="all">All Statuses</option>
              {["active","suspended","graduated","withdrawn","deferred"].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-4 w-4" /> Export</Button>
          <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Enrol Student</Button>
        </div>

        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Program</th>
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium">GPA</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center text-sm text-muted-foreground">No students found.</td></tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-[11px] font-semibold text-white">
                            {s.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <p className="font-medium">{s.full_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.student_number}</td>
                      <td className="px-4 py-3 text-sm">{s.department}</td>
                      <td className="px-4 py-3 text-sm">{s.program}</td>
                      <td className="px-4 py-3 text-sm">Year {s.year_of_study}</td>
                      <td className="px-4 py-3">
                        <span className={cn("font-semibold tabular-nums text-sm", s.gpa >= 3.5 ? "text-emerald-700" : s.gpa >= 2.5 ? "text-amber-700" : "text-rose-700")}>
                          {s.gpa.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", STATUS_CLS[s.enrollment_status] ?? "bg-muted text-muted-foreground")}>
                          {s.enrollment_status.charAt(0).toUpperCase() + s.enrollment_status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted">Profile</button>
                        <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted">Transcript</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              Showing {filtered.length} of {MOCK_STUDENTS.length} students
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
