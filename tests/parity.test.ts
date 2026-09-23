import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { GROUPS } from '../src/pages/portal/_nav'

const here = dirname(fileURLToPath(import.meta.url))
const appSrc = readFileSync(resolve(here, '../src/App.tsx'), 'utf8')

// Portal child routes: <Route path="x" ...> where the path has no leading slash
// and is not the catch-all. These are the only targets a nav item can point to.
const routePaths = new Set(
  [...appSrc.matchAll(/<Route\s+path="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((p) => p !== '*' && !p.startsWith('/')),
)

const navTargets = GROUPS.flatMap((g) => g.items.map((i) => i.to))

describe('navigation ↔ route parity', () => {
  it('every sidebar/command-palette nav item resolves to a real route (no dead links)', () => {
    const dead = navTargets.filter((to) => !routePaths.has(to))
    expect(dead, `nav items with no matching <Route>: ${dead.join(', ')}`).toEqual([])
  })

  it('every portal route is reachable from the nav (no orphan pages)', () => {
    // Pages intentionally reachable only by deep-link / drill-through, not the sidebar.
    const allowlist = new Set<string>([])
    const orphans = [...routePaths].filter((p) => !navTargets.includes(p) && !allowlist.has(p))
    expect(orphans, `routes with no nav entry: ${orphans.join(', ')}`).toEqual([])
  })

  it('has no duplicate nav targets', () => {
    const seen = new Set<string>()
    const dupes = navTargets.filter((t) => (seen.has(t) ? true : (seen.add(t), false)))
    expect(dupes, `duplicate nav targets: ${dupes.join(', ')}`).toEqual([])
  })
})
