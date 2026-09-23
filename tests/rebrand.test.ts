import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { customers } from '../src/data/customers'
import { fmtCur, fmtNum } from '../src/i18n/fmt'
import { pickAnswer } from '../src/components/AskTheData'

const root = fileURLToPath(new URL('../', import.meta.url))

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = resolve(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(filename) : /\.(tsx?|css)$/.test(entry.name) ? [filename] : []
  })
}

describe('Cable Bahamas identity', () => {
  it('removes source brand, market, regulator and currency from active source', () => {
    const stale = /telenet|belgium|belgian|\bBIPT\b|\bEUR\b|€|Antwerp|Brussels|Proximus/i
    const matches = sourceFiles(resolve(root, 'src')).flatMap(filename => {
      const match = readFileSync(filename, 'utf8').match(stale)
      return match ? [{ filename, token: match[0] }] : []
    })
    expect(matches).toEqual([])
  })

  it('uses reserved fictional contacts with Bahamas formatting', () => {
    expect(customers).toHaveLength(8)
    for (const customer of customers) {
      expect(customer.id).toMatch(/^CBL-/)
      expect(customer.email).toMatch(/@example\.com$/)
      expect(customer.phone).toMatch(/^\+1 242 555-01\d{2}$/)
    }
  })

  it('removes inherited secondary cities, subsidiaries and competitor identities', () => {
    const stale = /\b(?:Eir|Eltrona|BASE Company|Berchem|Deurne|Ledeberg|Heverlee|Kuringen|Nekkerspoel|Gentbrugge|Sint-Gillis|Sint-Niklaas|Liège|Namur|Turnhout|Gent-West|Anderlecht|Charleroi|Ottignies|Roeselare|Ieper|Eupen|Tongeren|Tienen|Lokeren|Ninove|Maaseik|Dendermonde|Zottegem|Deinze|Eeklo|Wetteren|Zele|Hamme)\b/i
    for (const filename of sourceFiles(resolve(root, 'src'))) {
      expect(readFileSync(filename, 'utf8').match(stale), filename).toBeNull()
    }
  })

  it('uses regional coordinates rather than inherited European map positions', () => {
    const positions: { filename: string; lat: number; lng: number }[] = []
    for (const filename of sourceFiles(resolve(root, 'src'))) {
      const text = readFileSync(filename, 'utf8')
      const patterns = [
        /lat:\s*(-?\d+\.\d+),\s*lng:\s*(-?\d+(?:\.\d+)?)/g,
        /(?:center[= ]*\{?|^\s*(?:[A-Za-z]+|'[^']+'|"[^"]+"):\s*)\[\s*(-?\d+\.\d+),\s*(-?\d+(?:\.\d+)?)\s*\]/gm,
      ]
      for (const pattern of patterns) {
        for (const match of text.matchAll(pattern)) {
          positions.push({ filename, lat: Number(match[1]), lng: Number(match[2]) })
        }
      }
    }
    expect(positions.length).toBeGreaterThan(80)
    for (const position of positions) {
      expect(position.lat, position.filename).toBeGreaterThanOrEqual(20)
      expect(position.lat, position.filename).toBeLessThanOrEqual(28)
      expect(position.lng, position.filename).toBeGreaterThanOrEqual(-81)
      expect(position.lng, position.filename).toBeLessThanOrEqual(-72)
    }
  })

  it('formats Bahamas dollars with English grouping', () => {
    expect(fmtCur(1234)).toMatch(/1,234/)
    expect(fmtCur(1234)).not.toContain('€')
    expect(fmtNum(1234.5)).toBe('1,234.5')
  })

  it('keeps product catalogues and scripted answer contracts free of inherited bundles', () => {
    const stale = /\bONE\b|\bBit\b|\bVolt\b(?! Typhoon)|\beircode\b|\bMeir\b|Bekaert|Virgin|Walloon|@[a-zA-Z0-9.-]+\.(?:be|ie)\b/
    for (const filename of sourceFiles(resolve(root, 'src'))) {
      expect(readFileSync(filename, 'utf8').match(stale), filename).toBeNull()
    }
    const answers = readFileSync(resolve(root, 'src/components/AskTheData.tsx'), 'utf8')
    expect(answers).toContain("bundle IN ('REVConnect', 'BB_ONLY')")
    expect(answers).toContain('REVConnect customers')
    const answer = pickAnswer('Average true margin for REVConnect customers vs. broadband-only first 12 months')
    expect(answer.summary).toContain('REVConnect customers')
    expect(answer.sql).toContain("bundle IN ('REVConnect', 'BB_ONLY')")
  })

  it('uses the new asset base and explicit synthetic scenario notice', () => {
    expect(readFileSync(resolve(root, 'vite.config.ts'), 'utf8')).toContain("base: '/CableBahamas/'")
    expect(existsSync(resolve(root, 'public/rev-logo.png'))).toBe(true)
    expect(readFileSync(resolve(root, 'src/pages/portal/PortalLayout.tsx'), 'utf8')).toContain('Synthetic demo data')
  })
})
