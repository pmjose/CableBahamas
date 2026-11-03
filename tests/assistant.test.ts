import { describe, expect, it } from 'vitest'
import { answer, ISLANDS, type Context } from '../src/assistant/engine'
import { COMMERCIAL_BASE, NETWORK_BASE } from '../src/data/scenario'

describe('Cable Bahamas Intelligence assistant', () => {
  it('routes common business questions to the right topic', () => {
    const cases: [string, string][] = [
      ['How are we doing?', 'overview'], ['what was revenue last month', 'revenue'], ['revenue by service line', 'revenue_mix'],
      ['EBITDA this year', 'ebitda'], ['free cash flow', 'cash'], ['How many customers do we have?', 'subscribers'],
      ['which island has highest churn', 'churn'], ['who is likely to leave', 'at_risk'], ['best customers in nassau', 'top_customers'],
      ['Tell me about Daniel Pinder', 'customer_lookup'], ['ARPU', 'arpu'], ['is REVConnect profitable', 'bundle_margin'],
      ['what if we raise prices', 'pricing'], ['how do we compare with BTC', 'competitor'], ['b2b pipeline', 'b2b'],
      ['overdue invoices', 'collections'], ['any billing leakage', 'revenue_assurance'], ['network sites by island', 'network'],
      ['is anything down right now', 'outage'], ['are we ready for a hurricane', 'hurricane'], ['NPS', 'care'],
      ['what offers work to save customers', 'retention_offers'], ['URCA filing', 'regulatory'], ['fraud this month', 'fraud'],
      ['best marketing channel', 'marketing'], ['net adds', 'adds'], ['headcount', 'people'], ['solar energy', 'energy'],
      ['what can you do', 'agents'],
    ]
    for (const [q, intent] of cases) expect(answer(q).intent, q).toBe(intent)
  })

  it('carries context into follow-up questions', () => {
    let ctx: Context = {}
    const first = answer('How many customers do we have?', ctx)
    ctx = { lastIntent: first.intent }
    const follow = answer('and in Freeport?', ctx)
    expect(follow.intent).toBe('subscribers')
    expect(follow.title).toContain('Grand Bahama')
  })

  it('never invents a number for gibberish or off-topic questions', () => {
    for (const q of ['asdfgh', 'tell me a joke', 'unsupported question']) {
      const r = answer(q, { lastIntent: 'cash' })
      expect(r.intent, q).toBe('clarify')
      expect(r.sources).toEqual([])
    }
  })

  it('proposes actions and follow-ups on every answer', () => {
    for (const q of ['revenue', 'churn', 'hurricane', 'outage', 'b2b pipeline', 'Tell me about Leah Ferguson']) {
      const r = answer(q)
      expect(r.actions.length, q).toBeGreaterThan(0)
      expect(r.followUps.length, q).toBeGreaterThan(0)
    }
  })

  it('island allocation reconciles to the national baseline', () => {
    expect(ISLANDS.reduce((s, i) => s + i.fixedSubs, 0)).toBe(COMMERCIAL_BASE.fixedSubscriptions)
    expect(ISLANDS.reduce((s, i) => s + i.mobileSubs, 0)).toBe(COMMERCIAL_BASE.mobileSubscriptions)
    expect(ISLANDS.reduce((s, i) => s + i.homesPassed, 0)).toBe(NETWORK_BASE.homesPassed)
    expect(ISLANDS.reduce((s, i) => s + i.sites, 0)).toBe(NETWORK_BASE.activeSites)
  })
})
