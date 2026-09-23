const lang = () => 'en-BS'

export function fmtNum(v: number, opts: Intl.NumberFormatOptions = {}): string {
  if (v === null || v === undefined || isNaN(v)) return '—'
  return new Intl.NumberFormat(lang(), { maximumFractionDigits: 2, ...opts }).format(v)
}

export function fmtInt(v: number): string {
  if (v === null || v === undefined || isNaN(v)) return '—'
  return new Intl.NumberFormat(lang(), { maximumFractionDigits: 0 }).format(v)
}

export function fmtCur(v: number, currency = 'BSD'): string {
  if (v === null || v === undefined || isNaN(v)) return '—'
  return new Intl.NumberFormat(lang(), { style: 'currency', currency, maximumFractionDigits: 0 }).format(v)
}

export function fmtCurDecimal(v: number, currency = 'BSD'): string {
  if (v === null || v === undefined || isNaN(v)) return '—'
  return new Intl.NumberFormat(lang(), { style: 'currency', currency, maximumFractionDigits: 2 }).format(v)
}

export function fmtPct(v: number, decimals = 1): string {
  if (v === null || v === undefined || isNaN(v)) return '—'
  return new Intl.NumberFormat(lang(), { style: 'percent', maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(v)
}

export function fmtDate(d: Date | string | number): string {
  const dt = d instanceof Date ? d : new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return new Intl.DateTimeFormat(lang(), { year: 'numeric', month: '2-digit', day: '2-digit' }).format(dt)
}

export function fmtMonth(d: Date | string | number): string {
  const dt = d instanceof Date ? d : new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return new Intl.DateTimeFormat(lang(), { month: 'short' }).format(dt)
}

export function fmtMonthYear(d: Date | string | number): string {
  const dt = d instanceof Date ? d : new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return new Intl.DateTimeFormat(lang(), { month: 'short', year: '2-digit' }).format(dt)
}

// Compact number with M / K suffix - locale-aware
export function fmtCompact(v: number, decimals = 1): string {
  if (v === null || v === undefined || isNaN(v)) return '—'
  return new Intl.NumberFormat(lang(), { notation: 'compact', maximumFractionDigits: decimals }).format(v)
}
