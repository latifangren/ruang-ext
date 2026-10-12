import { describe, expect, it } from 'vitest'
import { buildCommands, filterCommands } from './CommandPalette.tsx'

describe('filterCommands', () => {
  const items = buildCommands()

  it('returns every command on an empty query', () => {
    expect(filterCommands('', items)).toHaveLength(items.length)
    expect(filterCommands('   ', items)).toHaveLength(items.length)
  })

  it('matches page labels case-insensitively', () => {
    const labels = filterCommands('AGENTS', items).map((item) => item.label)
    expect(labels).toContain('Agents')
  })

  it('matches keywords such as "board" for Task Board', () => {
    const results = filterCommands('board', items)
    expect(results[0]?.label).toBe('Task Board')
  })

  it('ranks prefix matches before substring matches', () => {
    const labels = filterCommands('offi', items).map((item) => item.label)
    expect(labels[0]).toBe('Office')
    expect(labels).toContain('Toggle office panel')
    expect(labels.indexOf('Office')).toBeLessThan(labels.indexOf('Toggle office panel'))
  })

  it('matches action keywords like "dark" for the theme toggle', () => {
    const results = filterCommands('dark', items)
    expect(results).toHaveLength(1)
    expect(results[0]?.id).toBe('theme')
  })

  it('returns no items when nothing matches', () => {
    expect(filterCommands('zzz-no-such-command', items)).toHaveLength(0)
  })
})
