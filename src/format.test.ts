import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from './format.ts'

describe('formatRelativeTime', () => {
  const now = 1_700_000_000_000

  it('labels recent syncs in seconds', () => {
    expect(formatRelativeTime(now, now)).toBe('synced 0s ago')
    expect(formatRelativeTime(now - 12_000, now)).toBe('synced 12s ago')
    expect(formatRelativeTime(now - 59_999, now)).toBe('synced 59s ago')
  })

  it('labels syncs under an hour in minutes', () => {
    expect(formatRelativeTime(now - 60_000, now)).toBe('synced 1m ago')
    expect(formatRelativeTime(now - 3 * 60_000, now)).toBe('synced 3m ago')
    expect(formatRelativeTime(now - 59 * 60_000, now)).toBe('synced 59m ago')
  })

  it('labels older syncs in hours', () => {
    expect(formatRelativeTime(now - 60 * 60_000, now)).toBe('synced 1h ago')
    expect(formatRelativeTime(now - 25 * 60 * 60_000, now)).toBe('synced 25h ago')
  })

  it('handles edge cases gracefully', () => {
    // A timestamp in the future (clock skew) never reads as negative.
    expect(formatRelativeTime(now + 30_000, now)).toBe('synced 0s ago')
    // Missing or unparseable timestamps keep a neutral placeholder.
    expect(formatRelativeTime(undefined, now)).toBe('—')
    expect(formatRelativeTime(Number.NaN, now)).toBe('—')
  })
})
