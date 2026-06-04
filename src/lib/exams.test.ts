import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }) },
    from: vi.fn(),
  },
}))

import { getGrade } from './results'
import { calculateGPA } from './students'
import type { AcademicRecord } from './students'

// ── Grade calculation tests ────────────────────────────────────
describe('getGrade', () => {
  it('returns A for 95%', () => {
    expect(getGrade(95).label).toBe('A')
  })
  it('returns B for 80%', () => {
    expect(getGrade(80).label).toBe('B')
  })
  it('returns C for 65%', () => {
    expect(getGrade(65).label).toBe('C')
  })
  it('returns D for 55%', () => {
    expect(getGrade(55).label).toBe('D')
  })
  it('returns F for 40%', () => {
    expect(getGrade(40).label).toBe('F')
  })
  it('returns F for 0%', () => {
    expect(getGrade(0).label).toBe('F')
  })
  it('returns A for exactly 90%', () => {
    expect(getGrade(90).label).toBe('A')
  })
  it('returns correct grade points', () => {
    expect(getGrade(95).points).toBe(4.0)
    expect(getGrade(80).points).toBe(3.0)
    expect(getGrade(40).points).toBe(0.0)
  })
})

// ── GPA calculation tests ──────────────────────────────────────
describe('calculateGPA', () => {
  const makeRecord = (grade_points: number, credit_hours: number, status = 'completed'): AcademicRecord => ({
    id: crypto.randomUUID(),
    student_id: 'student-1',
    organization_id: null,
    course_code: 'CS101',
    course_name: 'Test Course',
    credit_hours,
    grade: null,
    grade_points,
    semester: 'Fall',
    academic_year: '2025',
    status: status as AcademicRecord['status'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  it('returns 0 for empty records', async () => {
    expect(await calculateGPA([])).toBe(0)
  })

  it('calculates simple GPA correctly', async () => {
    const records = [
      makeRecord(4.0, 3), // A, 3 credits
      makeRecord(3.0, 3), // B, 3 credits
    ]
    const gpa = await calculateGPA(records)
    expect(gpa).toBe(3.5)
  })

  it('weights GPA by credit hours', async () => {
    const records = [
      makeRecord(4.0, 1), // A, 1 credit
      makeRecord(2.0, 3), // C, 3 credits
    ]
    const gpa = await calculateGPA(records)
    expect(gpa).toBe(2.5) // (4*1 + 2*3) / 4 = 10/4 = 2.5
  })

  it('ignores non-completed records', async () => {
    const records = [
      makeRecord(4.0, 3, 'completed'),
      makeRecord(0.0, 3, 'enrolled'),  // should be ignored
      makeRecord(0.0, 3, 'failed'),    // should be ignored (no grade_points set via null)
    ]
    records[2].grade_points = null
    const gpa = await calculateGPA(records)
    expect(gpa).toBe(4.0) // only the completed one counts
  })
})
