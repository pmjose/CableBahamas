type Props = {
  seed: string
  size?: number
  className?: string
  /** Force gender; if omitted, derived from `name` if provided, otherwise from seed parity */
  female?: boolean
  name?: string
}

// Simple deterministic hash → integer
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

const FEMALE_FIRST_NAMES = new Set([
  'emma', 'marie', 'sofie', 'anke', 'elena', 'femke', 'lore', 'britt',
  'lien', 'fien', 'noor', 'julie', 'amber', 'nore', 'lotte', 'ella',
  'marie', 'sara', 'ann', 'eva', 'silke', 'charlotte', 'oona', 'maud',
  'mary', 'catherine', 'anne', 'sarah', 'lucy', 'sophie', 'olivia', 'nina',
])

function detectFemale(name?: string): boolean | undefined {
  if (!name) return undefined
  const first = name.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
  if (!first) return undefined
  return FEMALE_FIRST_NAMES.has(first)
}

const HAIRS = ['#1f2937', '#0f172a', '#3f2a1d', '#4a2c1f', '#5b3a29', '#7c5a3a', '#9a6b3f']
const SKINS = ['#f4cda1', '#eebd92', '#e6b088', '#d99e74', '#c8895f']
const CHEEKS = ['#fb7185', '#f472b6', '#fda4af']
const LIPS = ['#dc2626', '#e11d48', '#be123c', '#f43f5e']

/**
 * Clean, culturally-neutral cartoon avatar — fully inline SVG, deterministic per seed.
 * Female: longer hair, eyelashes, lips, small earrings.
 * Male: short hair, subtle smile.
 * A wink shows occasionally — a nod to the Cable Bahamas smiley.
 *
 * Component name kept as `LeprechaunAvatar` for backward compatibility with existing imports.
 */
export default function LeprechaunAvatar({ seed, size = 64, className = '', female, name }: Props) {
  const h = hash(seed)
  const isFemale = female ?? detectFemale(name) ?? (h % 2 === 0)
  const hair = HAIRS[h % HAIRS.length]
  const skin = SKINS[(h >> 3) % SKINS.length]
  const cheek = CHEEKS[(h >> 5) % CHEEKS.length]
  const lip = LIPS[(h >> 6) % LIPS.length]
  const winks = (h >> 11) % 3 === 0
  const freckles = (h >> 13) % 5 === 0
  const id = seed.replace(/[^a-zA-Z0-9]/g, '')

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Avatar for ${seed}`}
    >
      <defs>
        <radialGradient id={`bg-${id}`} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#fff3f0" />
          <stop offset="100%" stopColor="#ffe0da" />
        </radialGradient>
      </defs>

      {/* circular bg */}
      <circle cx="50" cy="50" r="50" fill={`url(#bg-${id})`} />

      {/* shoulders / collar — Cable Bahamas tabasco shirt */}
      <path d="M 12 100 Q 18 78 32 74 L 68 74 Q 82 78 88 100 Z" fill="#FF4438" />
      <path d="M 38 76 L 50 84 L 62 76 L 60 90 L 40 90 Z" fill="#fff" opacity="0.9" />

      {/* neck */}
      <rect x="44" y="68" width="12" height="8" fill={skin} />

      {/* female: longer hair behind */}
      {isFemale && (
        <>
          <path
            d="M 26 40 Q 24 68 32 86 L 40 86 Q 34 66 36 48 Z"
            fill={hair}
          />
          <path
            d="M 74 40 Q 76 68 68 86 L 60 86 Q 66 66 64 48 Z"
            fill={hair}
          />
          <ellipse cx="50" cy="42" rx="23" ry="21" fill={hair} />
        </>
      )}

      {/* face */}
      <ellipse cx="50" cy="52" rx="20" ry="22" fill={skin} />

      {/* ears */}
      <ellipse cx="29" cy="54" rx="3" ry="4.5" fill={skin} />
      <ellipse cx="71" cy="54" rx="3" ry="4.5" fill={skin} />

      {/* female: small earrings */}
      {isFemale && (
        <>
          <circle cx="29" cy="60" r="1.4" fill="#FF4438" stroke="#9a2f1f" strokeWidth="0.3" />
          <circle cx="71" cy="60" r="1.4" fill="#FF4438" stroke="#9a2f1f" strokeWidth="0.3" />
        </>
      )}

      {/* male: short hair on top of head */}
      {!isFemale && (
        <>
          <path
            d="M 30 42 Q 32 30 50 28 Q 68 30 70 42 Q 64 36 50 36 Q 36 36 30 42 Z"
            fill={hair}
          />
          <path d="M 34 60 Q 38 70 50 72 Q 62 70 66 60 Q 60 64 50 64 Q 40 64 34 60 Z" fill={hair} opacity="0.18" />
        </>
      )}

      {/* eyes (winking = Cable Bahamas smiley nod) */}
      {winks ? (
        <>
          <path d="M 40 47 Q 43 45 46 47" stroke="#1a1a1a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <circle cx="56" cy="47" r="1.8" fill="#1a1a1a" />
          <circle cx="56.5" cy="46.5" r="0.6" fill="#fff" />
        </>
      ) : (
        <>
          <circle cx="43" cy="47" r="1.8" fill="#1a1a1a" />
          <circle cx="57" cy="47" r="1.8" fill="#1a1a1a" />
          <circle cx="43.5" cy="46.5" r="0.6" fill="#fff" />
          <circle cx="57.5" cy="46.5" r="0.6" fill="#fff" />
        </>
      )}

      {/* female: eyelashes */}
      {isFemale && (
        <>
          <path d="M 41 45 L 40 43.5 M 43 44.5 L 43 43 M 45 45 L 46 43.5" stroke="#1a1a1a" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M 55 45 L 54 43.5 M 57 44.5 L 57 43 M 59 45 L 60 43.5" stroke="#1a1a1a" strokeWidth="0.8" strokeLinecap="round" />
        </>
      )}

      {/* eyebrows */}
      <path d="M 38 42 Q 43 40 47 42" stroke={hair} strokeWidth={isFemale ? 1.2 : 2} fill="none" strokeLinecap="round" />
      <path d="M 53 42 Q 57 40 62 42" stroke={hair} strokeWidth={isFemale ? 1.2 : 2} fill="none" strokeLinecap="round" />

      {/* nose */}
      <path d="M 48 50 Q 50 56 52 50 Q 51 53 50 53 Q 49 53 48 50" fill={skin} stroke="#c97b5b" strokeWidth="0.4" />

      {/* female: lips */}
      {isFemale && (
        <>
          <path d="M 44 60 Q 47 58 50 59 Q 53 58 56 60 Q 53 63 50 62 Q 47 63 44 60 Z" fill={lip} />
          <path d="M 46 60 Q 50 61 54 60" stroke="#1a1a1a" strokeWidth="0.3" fill="none" opacity="0.4" />
        </>
      )}
      {/* male: subtle smile */}
      {!isFemale && (
        <path d="M 44 60 Q 50 64 56 60" stroke="#7f1d1d" strokeWidth="1" fill="none" strokeLinecap="round" />
      )}

      {/* cheeks */}
      <circle cx="36" cy="54" r="3" fill={cheek} opacity={isFemale ? 0.55 : 0.4} />
      <circle cx="64" cy="54" r="3" fill={cheek} opacity={isFemale ? 0.55 : 0.4} />

      {/* freckles */}
      {freckles && (
        <>
          <circle cx="40" cy="51" r="0.5" fill="#9a3412" />
          <circle cx="42" cy="53" r="0.5" fill="#9a3412" />
          <circle cx="58" cy="51" r="0.5" fill="#9a3412" />
          <circle cx="60" cy="53" r="0.5" fill="#9a3412" />
        </>
      )}

      {/* subtle shadow under hair */}
      <ellipse cx="50" cy="34" rx="22" ry="1.5" fill="#1a1a1a" opacity="0.08" />
    </svg>
  )
}
