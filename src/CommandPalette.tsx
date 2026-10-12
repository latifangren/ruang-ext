import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { navigation, pageIcons, pageSlug, type Page } from './routes.ts'

/** Fired by the palette so the Office page can toggle its panel even though the
 *  palette lives in the App shell. Office also persists its own state, so a
 *  navigate-first palette action additionally pre-writes localStorage (the same
 *  keys Office reads on mount) for the case where Office is not mounted yet. */
export const OFFICE_PANEL_TOGGLE = 'ruang:office-panel-toggle'
/** detail: { view: '2d' | '3d' } */
export const OFFICE_VIEW_SWITCH = 'ruang:office-view'

export interface CommandItem {
  readonly id: string
  readonly label: string
  readonly icon: string
  readonly keywords: string
  readonly group: 'Pages' | 'Actions'
  readonly page?: Page
}

const PAGE_KEYWORDS: Record<Page, string> = {
  Office: 'office home dashboard 3d virtual',
  Agents: 'agents crew bots',
  Usage: 'usage tokens cost stats',
  'Task Board': 'task board kanban board',
  Calendar: 'calendar schedule events',
  Activity: 'activity feed timeline',
  Memory: 'memory knowledge notes',
  Folders: 'folders files directories',
  Logs: 'logs errors cli',
  Settings: 'settings preferences config',
}

/** Every page plus the read-only global actions, in the order they render. */
export function buildCommands(): CommandItem[] {
  const pages = navigation.map((page): CommandItem => ({
    id: `page:${pageSlug(page)}`,
    label: page,
    icon: pageIcons[page],
    keywords: PAGE_KEYWORDS[page],
    group: 'Pages',
    page,
  }))
  const actions: CommandItem[] = [
    { id: 'refresh', label: 'Refresh all sources', icon: '↻', keywords: 'reload sync refetch update', group: 'Actions' },
    { id: 'theme', label: 'Toggle theme', icon: '◐', keywords: 'dark light mode appearance', group: 'Actions' },
    { id: 'office-panel', label: 'Toggle office panel', icon: '◧', keywords: 'panel sidebar crew stats office', group: 'Actions' },
    { id: 'office-2d', label: 'Office: 2D view', icon: '▦', keywords: 'office 2d flat view', group: 'Actions' },
    { id: 'office-3d', label: 'Office: 3D view', icon: '◈', keywords: 'office 3d three dimensional view', group: 'Actions' },
  ]
  return [...pages, ...actions]
}

/** Case-insensitive substring match on label + keywords. Prefix matches rank
 *  first, then label substrings, then keyword matches; ties keep build order. */
export function filterCommands(query: string, items: readonly CommandItem[]): CommandItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...items]
  const scored: { item: CommandItem; rank: number }[] = []
  for (const item of items) {
    const label = item.label.toLowerCase()
    if (label.startsWith(q)) scored.push({ item, rank: 0 })
    else if (label.includes(q)) scored.push({ item, rank: 1 })
    else if (`${label} ${item.keywords.toLowerCase()}`.includes(q)) scored.push({ item, rank: 2 })
  }
  scored.sort((a, b) => a.rank - b.rank)
  return scored.map((entry) => entry.item)
}

function highlight(label: string, query: string): ReactNode {
  const q = query.trim()
  if (!q) return label
  const index = label.toLowerCase().indexOf(q.toLowerCase())
  if (index < 0) return label
  return <>{label.slice(0, index)}<mark>{label.slice(index, index + q.length)}</mark>{label.slice(index + q.length)}</>
}

export function CommandPalette({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (item: CommandItem) => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const uid = useId()
  const items = useMemo(buildCommands, [])
  const pages = useMemo(() => filterCommands(query, items.filter((item) => item.group === 'Pages')), [query, items])
  const actions = useMemo(() => filterCommands(query, items.filter((item) => item.group === 'Actions')), [query, items])
  const total = pages.length + actions.length

  useEffect(() => {
    if (open) { setQuery(''); setActive(0); input.current?.focus() }
  }, [open ])
  useEffect(() => {
    setActive((index) => Math.min(index, Math.max(total - 1, 0)))
  }, [total])
  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const choose = (index: number) => {
    const item = index < pages.length ? pages[index] : actions[index - pages.length]
    if (item) onSelect(item)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((index) => total === 0 ? 0 : (index + 1) % total) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => total === 0 ? 0 : (index - 1 + total) % total) }
    else if (event.key === 'Enter') { event.preventDefault(); choose(active) }
    else if (event.key === 'Escape') { event.preventDefault(); onClose() }
  }

  if (!open) return null
  const listId = `${uid}-list`
  const renderItem = (item: CommandItem, index: number) => (
    <li key={item.id} id={`${uid}-option-${index}`} role="option" aria-selected={index === active}
      className="command-palette-item" onClick={() => choose(index)}
      onMouseMove={() => { if (index !== active) setActive(index) }}>
      <span className="item-icon" aria-hidden="true">{item.icon}</span>
      <span className="item-label">{highlight(item.label, query)}</span>
    </li>
  )
  return <>
    <div className="command-palette-backdrop" onClick={onClose} aria-hidden="true"/>
    <div className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="command-palette-input-row">
        <span className="command-palette-search-icon" aria-hidden="true">⌕</span>
        <input ref={input} type="text" role="combobox" aria-expanded="true" aria-controls={listId}
          aria-activedescendant={total > 0 ? `${uid}-option-${active}` : undefined}
          aria-label="Filter commands" placeholder="Type a command or page name…" autoComplete="off" spellCheck={false}
          value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={onKeyDown}/>
        <kbd>esc</kbd>
      </div>
      <ul id={listId} ref={list} role="listbox" aria-label="Commands" className="command-palette-list">
        {total === 0 && <li className="command-palette-empty">No matches for “{query.trim()}”</li>}
        {pages.length > 0 && <li role="presentation" className="command-palette-group" aria-hidden="true">Pages</li>}
        {pages.map((item, index) => renderItem(item, index))}
        {actions.length > 0 && <li role="presentation" className="command-palette-group" aria-hidden="true">Actions</li>}
        {actions.map((item, index) => renderItem(item, pages.length + index))}
      </ul>
      <div className="command-palette-hint" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> select</span><span><kbd>esc</kbd> close</span></div>
    </div>
  </>
}
