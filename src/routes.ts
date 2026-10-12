export const navigation = ['Office', 'Agents', 'Usage', 'Task Board', 'Calendar', 'Activity', 'Memory', 'Folders', 'Logs', 'Settings'] as const
export type Page = typeof navigation[number]

/** One glyph per page, in the same unicode-geometric style as the app's other
 *  icon buttons (☰ ✕ ☀ ☾ ↻). Rendered with aria-hidden: the label carries the
 *  accessible name. */
export const pageIcons: Record<Page, string> = {
  Office: '⌂',
  Agents: '◈',
  'Task Board': '▤',
  Calendar: '◷',
  Activity: '◔',
  Memory: '✎',
  Folders: '◧',
  Usage: '◐',
  Logs: '≣',
  Settings: '⚙',
}

export interface NavGroup {
  readonly label: string
  readonly pages: readonly Page[]
}

/** Drawer nav sections, in the order they render. */
export const navGroups: readonly NavGroup[] = [
  { label: 'Office', pages: ['Office'] },
  { label: 'Crew', pages: ['Agents', 'Task Board', 'Calendar', 'Activity'] },
  { label: 'Data', pages: ['Memory', 'Folders', 'Usage', 'Logs'] },
  { label: 'System', pages: ['Settings'] },
]

/** The page shown when the address names no page (or an unknown one). */
export const HOME: Page = 'Office'

export function pageSlug(page: Page): string {
  return page.toLowerCase().replace(/\s+/g, '-')
}

export function pageFromHash(hash: string): Page {
  const slug = hash.replace(/^#\/?/, '').split('/')[0].toLowerCase()
  if (slug === 'knowledge') return 'Memory'
  // The Dashboard's statistics now live in the Office HUD and panel.
  if (slug === 'dashboard') return 'Office'
  return navigation.find((page) => pageSlug(page) === slug) ?? HOME
}
