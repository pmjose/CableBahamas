import i18n from './index'

/**
 * Hook-free translate. Use anywhere — inside helper functions, outside components, etc.
 * Returns the translation if a key exists, otherwise returns the input unchanged
 * (so untranslated English passes through untouched).
 */
export function tt(key: string | undefined | null): string {
  if (key === null || key === undefined) return ''
  if (typeof key !== 'string') return String(key)
  const v = i18n.t(key, { defaultValue: key })
  return typeof v === 'string' ? v : key
}

export default tt
