import { describe, it, expect } from 'vitest'
import { pickActiveSchedule } from './scheduling'

describe('pickActiveSchedule', () => {
  const makeSchedule = (startOffset: number, endOffset: number) => ({
    id: crypto.randomUUID(),
    start_at: new Date(Date.now() + startOffset).toISOString(),
    end_at:   new Date(Date.now() + endOffset).toISOString(),
  })

  it('returns null for empty array', () => {
    expect(pickActiveSchedule([])).toBeNull()
  })

  it('returns the schedule that is currently active', () => {
    const past   = makeSchedule(-10_000, -1_000)   // ended
    const active = makeSchedule(-5_000, 10_000_000) // active now
    const future = makeSchedule(10_000, 20_000)     // not started

    const result = pickActiveSchedule([past, active, future])
    expect(result?.id).toBe(active.id)
  })

  it('returns null when no schedule is active', () => {
    const past   = makeSchedule(-10_000, -1_000)
    const future = makeSchedule(10_000, 20_000)
    expect(pickActiveSchedule([past, future])).toBeNull()
  })

  it('returns the earliest active schedule when multiple are active', () => {
    const first  = makeSchedule(-10_000, 10_000_000)
    const second = makeSchedule(-5_000, 10_000_000)
    const result = pickActiveSchedule([second, first])
    expect(result?.id).toBe(first.id)
  })
})
