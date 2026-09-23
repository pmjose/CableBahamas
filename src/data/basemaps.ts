export type BasemapStyle = 'voyager' | 'positron' | 'dark'

const paths: Record<BasemapStyle, string> = {
  voyager: 'rastertiles/voyager',
  positron: 'light_all',
  dark: 'dark_all',
}

export function basemapUrl(style: BasemapStyle, key: string): string | null {
  const trimmed = key.trim()
  if (!trimmed || trimmed.startsWith('<')) return null
  return `https://{s}.basemaps.cartocdn.com/${paths[style]}/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(trimmed)}`
}

export const BAHAMAS_CENTER: [number, number] = [24.4, -76.3]
export const BAHAMAS_BOUNDS: [[number, number], [number, number]] = [[20.7, -79.6], [27.1, -72.6]]
