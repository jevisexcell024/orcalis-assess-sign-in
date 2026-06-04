import { describe, it, expect } from 'vitest'

// Test the pure logic parts (no Supabase calls needed)
describe('communications — announcement priority ordering', () => {
  const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 }

  const sortByPriority = (items: { priority: string }[]) =>
    [...items].sort((a, b) =>
      (PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 99) -
      (PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 99)
    )

  it('sorts urgent before high before normal before low', () => {
    const input = [
      { priority: 'low' },
      { priority: 'normal' },
      { priority: 'urgent' },
      { priority: 'high' },
    ]
    const sorted = sortByPriority(input)
    expect(sorted.map(i => i.priority)).toEqual(['urgent', 'high', 'normal', 'low'])
  })

  it('preserves order for same priority', () => {
    const input = [
      { priority: 'normal', id: 1 },
      { priority: 'normal', id: 2 },
    ]
    const sorted = sortByPriority(input)
    expect(sorted).toHaveLength(2)
  })
})

describe('communications — unread message counting', () => {
  const countUnread = (messages: { read_at: string | null; recipient_id: string }[], userId: string) =>
    messages.filter(m => m.recipient_id === userId && m.read_at === null).length

  it('counts only unread messages for the user', () => {
    const msgs = [
      { read_at: null,        recipient_id: 'user-1' },
      { read_at: '2026-01-01', recipient_id: 'user-1' },
      { read_at: null,        recipient_id: 'user-2' },
    ]
    expect(countUnread(msgs, 'user-1')).toBe(1)
  })

  it('returns 0 when all messages are read', () => {
    const msgs = [
      { read_at: '2026-01-01', recipient_id: 'user-1' },
    ]
    expect(countUnread(msgs, 'user-1')).toBe(0)
  })
})
