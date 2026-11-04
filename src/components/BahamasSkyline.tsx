// Subtle silhouette of Bahamas landmarks for the gate page: Hope Town lighthouse,
// a Bahamian sloop, Baha Mar, Fort Fincastle and the Water Tower, Christ Church
// Cathedral, a cruise ship at Prince George Wharf, the Paradise Island bridges,
// Atlantis Royal Towers, Paradise Island lighthouse, palms and a flamingo.
const INK = 'rgba(255,255,255,0.13)'
const LINE = 'rgba(255,255,255,0.22)'
const GLOW = 'rgba(255,226,77,0.55)'

function Palm({ x, h = 70, lean = 1 }: { x: number; h?: number; lean?: number }) {
  const top = 270 - h
  const tx = x + 10 * lean
  return (
    <g fill={INK} stroke={LINE} strokeWidth={1}>
      <path d={`M${x - 2},270 Q${x + 4 * lean},${top + h / 2} ${tx},${top}`} fill="none" strokeWidth={3} />
      {[-150, -110, -60, -20, 25].map((a, i) => {
        const r = (a * Math.PI) / 180
        const ex = tx + Math.cos(r) * 30 * (i % 2 ? 1 : 0.85)
        const ey = top - Math.sin(r) * 14 + 10
        return <path key={a} d={`M${tx},${top} Q${(tx + ex) / 2},${top - 14} ${ex},${ey}`} fill="none" strokeWidth={2.2} />
      })}
    </g>
  )
}

function Caption({ x, y, text }: { x: number; y: number; text: string }) {
  return <text x={x} y={y} textAnchor="middle" fontSize={9} letterSpacing={1.5} fill="rgba(255,255,255,0.22)" style={{ textTransform: 'uppercase' }}>{text}</text>
}

export default function BahamasSkyline() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34vh] min-h-[200px]" aria-hidden="true">
      <svg viewBox="0 0 1600 320" preserveAspectRatio="xMidYMax slice" className="w-full h-full">
        <defs>
          <linearGradient id="skyFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(0,0,0,0)" />
            <stop offset="1" stopColor="rgba(0,0,0,0.35)" />
          </linearGradient>
          <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(255,226,77,0.18)" />
            <stop offset="1" stopColor="rgba(255,226,77,0)" />
          </linearGradient>
        </defs>

        {/* Hope Town candy-stripe lighthouse, Abaco */}
        <g>
          <path d="M70,270 L78,150 L102,150 L110,270 Z" fill={INK} stroke={LINE} />
          {[170, 200, 230, 258].map(y => <path key={y} d={`M${70 + (270 - y) * 0.067},${y} L${110 - (270 - y) * 0.067},${y} L${110 - (270 - y + 12) * 0.067},${y - 12} L${70 + (270 - y + 12) * 0.067},${y - 12} Z`} fill="rgba(255,68,56,0.22)" />)}
          <rect x={76} y={136} width={28} height={14} fill={INK} stroke={LINE} />
          <path d="M74,136 L90,120 L106,136 Z" fill={INK} stroke={LINE} />
          <circle cx={90} cy={143} r={3} fill={GLOW} className="animate-pulse" />
          <path d="M93,140 L330,110 L330,176 Z" fill="url(#beam)" className="animate-pulse" />
          <Caption x={90} y={292} text="Hope Town" />
        </g>

        {/* Bahamian sloop */}
        <g fill={INK} stroke={LINE}>
          <path d="M160,262 L232,262 L222,272 L170,272 Z" />
          <path d="M196,260 L196,170 L238,258 Z" />
          <path d="M193,260 L193,186 L162,256 Z" />
        </g>

        <Palm x={262} h={78} lean={-1} />
        <Palm x={286} h={64} />

        {/* Baha Mar towers, Cable Beach */}
        <g fill={INK} stroke={LINE}>
          <path d="M318,270 L318,170 Q340,150 362,170 L362,270 Z" />
          <path d="M366,270 L366,140 Q392,116 418,140 L418,270 Z" />
          <path d="M422,270 L422,184 Q442,166 462,184 L462,270 Z" />
          {[0, 1, 2, 3, 4, 5].map(r => [0, 1, 2].map(c => <rect key={`${r}-${c}`} x={374 + c * 14} y={160 + r * 16} width={6} height={4} fill={(r + c) % 3 ? 'rgba(255,255,255,0.10)' : GLOW} stroke="none" />))}
          <Caption x={390} y={292} text="Cable Beach" />
        </g>

        {/* Fort Fincastle + Water Tower on Bennet's Hill */}
        <g fill={INK} stroke={LINE}>
          <path d="M470,270 Q560,226 650,270 Z" />
          <path d="M520,248 L600,248 L612,238 L512,238 Z" />
          <rect x={540} y={226} width={40} height={12} />
          {[0, 1, 2, 3].map(i => <rect key={i} x={543 + i * 9} y={221} width={5} height={5} stroke="none" />)}
          <path d="M616,252 L620,128 L640,128 L644,252 Z" />
          <rect x={614} y={116} width={32} height={14} />
          {[0, 1, 2].map(i => <rect key={i} x={617 + i * 10} y={110} width={6} height={6} stroke="none" />)}
          <Caption x={580} y={292} text="Fort Fincastle" />
        </g>

        {/* Christ Church Cathedral spire */}
        <g fill={INK} stroke={LINE}>
          <rect x={668} y={210} width={42} height={60} />
          <rect x={680} y={170} width={18} height={40} />
          <path d="M680,170 L689,124 L698,170 Z" />
          <path d="M686,250 L686,234 Q689,228 692,234 L692,250 Z" fill="rgba(255,226,77,0.25)" stroke="none" />
        </g>

        {/* Cruise ship at Prince George Wharf */}
        <g fill={INK} stroke={LINE}>
          <path d="M730,240 L1010,240 L992,268 L748,268 Z" />
          <path d="M748,240 L748,222 L988,222 L988,240 Z" />
          <path d="M766,222 L766,206 L966,206 L966,222 Z" />
          <path d="M790,206 L790,192 L930,192 L930,206 Z" />
          <path d="M890,192 L896,168 L922,168 L920,192 Z" fill="rgba(255,68,56,0.22)" />
          {Array.from({ length: 22 }, (_, i) => <rect key={i} x={754 + i * 10.5} y={229} width={5} height={3} fill={i % 4 ? 'rgba(255,255,255,0.12)' : GLOW} stroke="none" />)}
          {Array.from({ length: 17 }, (_, i) => <rect key={i} x={772 + i * 11} y={212} width={5} height={3} fill={i % 5 ? 'rgba(255,255,255,0.12)' : GLOW} stroke="none" />)}
          <rect x={720} y={266} width={300} height={4} />
          <Caption x={870} y={292} text="Prince George Wharf" />
        </g>

        {/* Paradise Island bridges */}
        <g fill="none" stroke={LINE} strokeWidth={1.4}>
          <path d="M1030,256 Q1080,214 1130,256" />
          <path d="M1036,262 Q1086,224 1136,262" />
          {[1044, 1060, 1076, 1092, 1108, 1124].map(x => <line key={x} x1={x} y1={270} x2={x} y2={252 - Math.max(0, 22 - Math.abs(x - 1084) / 2.2)} />)}
        </g>

        {/* Atlantis Royal Towers, Paradise Island */}
        <g fill={INK} stroke={LINE}>
          <path d="M1150,270 L1150,140 L1196,140 L1196,270 Z" />
          <path d="M1250,270 L1250,140 L1296,140 L1296,270 Z" />
          <path d="M1196,190 Q1223,150 1250,190 L1250,206 Q1223,170 1196,206 Z" />
          <path d="M1150,140 L1173,104 L1196,140 Z" />
          <path d="M1250,140 L1273,104 L1296,140 Z" />
          <path d="M1166,104 Q1173,84 1180,104 Z" />
          <path d="M1266,104 Q1273,84 1280,104 Z" />
          <path d="M1130,270 L1130,196 L1150,196 L1150,270 Z" />
          <path d="M1296,270 L1296,196 L1318,196 L1318,270 Z" />
          {[0, 1, 2, 3, 4, 5, 6].map(r => [0, 1].map(c => (
            <g key={`${r}-${c}`}>
              <rect x={1158 + c * 18} y={152 + r * 16} width={8} height={5} fill={(r + c) % 3 ? 'rgba(255,255,255,0.10)' : GLOW} stroke="none" />
              <rect x={1258 + c * 18} y={152 + r * 16} width={8} height={5} fill={(r + c + 1) % 3 ? 'rgba(255,255,255,0.10)' : GLOW} stroke="none" />
            </g>
          )))}
          <Caption x={1223} y={292} text="Paradise Island" />
        </g>

        {/* Paradise Island lighthouse */}
        <g fill={INK} stroke={LINE}>
          <path d="M1342,270 L1346,214 L1358,214 L1362,270 Z" />
          <rect x={1343} y={204} width={18} height={10} />
          <circle cx={1352} cy={209} r={2.5} fill={GLOW} className="animate-pulse" />
        </g>

        <Palm x={1400} h={82} />
        <Palm x={1428} h={66} lean={-1} />

        {/* Flamingo, Inagua (national bird) */}
        <g fill="rgba(255,120,120,0.22)" stroke="rgba(255,150,150,0.35)" strokeWidth={1}>
          <path d="M1494,226 Q1474,218 1480,206 Q1490,196 1500,206 Q1514,222 1530,214 Q1540,224 1524,234 Q1504,240 1494,226 Z" />
          <path d="M1486,206 Q1484,170 1500,164 Q1512,162 1510,172 Q1500,172 1500,180 Q1500,196 1492,204" fill="none" strokeWidth={4} stroke="rgba(255,120,120,0.30)" />
          <path d="M1510,170 L1520,176" strokeWidth={2} />
          <line x1={1506} y1={236} x2={1504} y2={270} />
          <line x1={1514} y1={236} x2={1520} y2={256} />
          <Caption x={1500} y={292} text="Inagua" />
        </g>

        {/* Water */}
        <rect x={0} y={270} width={1600} height={50} fill="url(#skyFade)" />
        <g fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1}>
          <path d="M0,276 Q40,272 80,276 T160,276 T240,276 T320,276 T400,276 T480,276 T560,276 T640,276 T720,276 T800,276 T880,276 T960,276 T1040,276 T1120,276 T1200,276 T1280,276 T1360,276 T1440,276 T1520,276 T1600,276">
            <animateTransform attributeName="transform" type="translate" from="0 0" to="-80 0" dur="6s" repeatCount="indefinite" />
          </path>
          <path d="M0,300 Q50,296 100,300 T200,300 T300,300 T400,300 T500,300 T600,300 T700,300 T800,300 T900,300 T1000,300 T1100,300 T1200,300 T1300,300 T1400,300 T1500,300 T1600,300 T1700,300" stroke="rgba(255,255,255,0.07)">
            <animateTransform attributeName="transform" type="translate" from="0 0" to="-100 0" dur="9s" repeatCount="indefinite" />
          </path>
        </g>
      </svg>
    </div>
  )
}
