import { useMemo, useState } from 'react'
import type { RelationshipGraph as RG, RelNode, RelNodeKind } from '../data/customerEnrichment'
import tt from '../i18n/tt'

const KIND_STYLE: Record<RelNodeKind, { fill: string; stroke: string; ring: string; icon: string; label: string }> = {
  self:       { fill: '#FF4438', stroke: '#A30000', ring: '#FFD7D7', icon: '★', label: 'Account holder' },
  household:  { fill: '#1F8A4C', stroke: '#0E5C30', ring: '#D8F0E2', icon: '⌂', label: 'Household' },
  business:   { fill: '#2563EB', stroke: '#1E3A8A', ring: '#DBEAFE', icon: '⌬', label: 'Business' },
  partner:    { fill: '#9333EA', stroke: '#5B21B6', ring: '#EDE9FE', icon: '♥', label: 'Partner / linked' },
  authorised: { fill: '#F59E0B', stroke: '#B45309', ring: '#FEF3C7', icon: '✓', label: 'Authorised contact' },
  address:    { fill: '#475569', stroke: '#1F2937', ring: '#E2E8F0', icon: '⌖', label: 'Premise' },
  referral:   { fill: '#EC4899', stroke: '#9D174D', ring: '#FCE7F3', icon: '→', label: 'Referral' },
  employer:   { fill: '#0891B2', stroke: '#155E75', ring: '#CFFAFE', icon: '⌬', label: 'Employer' },
  landlord:   { fill: '#65A30D', stroke: '#3F6212', ring: '#ECFCCB', icon: '⌂', label: 'Landlord' },
}

type Props = { graph: RG; onOpenCustomer?: (id: string) => void }

export default function RelationshipGraph({ graph, onOpenCustomer }: Props) {
  const [hover, setHover] = useState<{ node: RelNode; x: number; y: number } | null>(null)
  const [pinned, setPinned] = useState<RelNode | null>(null)

  const W = 720
  const H = 460
  const cx = W / 2
  const cy = H / 2

  // Radial layout: self at center, others in a ring (with angular jitter to feel organic)
  const positioned = useMemo(() => {
    const self = graph.nodes.find(n => n.kind === 'self')!
    const others = graph.nodes.filter(n => n.kind !== 'self')
    const map = new Map<string, { x: number; y: number; node: RelNode }>()
    map.set(self.id, { x: cx, y: cy, node: self })
    const n = others.length || 1
    others.forEach((node, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2
      // Distance varies subtly by kind so it isn't a perfect circle
      const r = node.kind === 'address' ? 130 : node.kind === 'business' ? 175 : node.kind === 'partner' ? 175 : 155
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      map.set(node.id, { x, y, node })
    })
    return map
  }, [graph])

  const active = pinned ?? hover?.node ?? null
  const tipX = hover?.x ?? 0
  const tipY = hover?.y ?? 0

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-[460px] bg-gradient-to-br from-[#fafbfc] to-[#f1f5f9] rounded-xl border border-black/5"
      >
        {/* Edges */}
        {graph.edges.map((e, i) => {
          const a = positioned.get(e.from)
          const b = positioned.get(e.to)
          if (!a || !b) return null
          const mx = (a.x + b.x) / 2
          const my = (a.y + b.y) / 2
          const isActive = active && (active.id === e.from || active.id === e.to)
          return (
            <g key={i}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={isActive ? '#FF4438' : '#94a3b8'}
                strokeWidth={isActive ? 2 : 1.2}
                strokeDasharray={e.strength < 2 ? '4 3' : undefined}
                opacity={isActive ? 0.9 : 0.5}
              />
              <rect x={mx - 32} y={my - 9} width={64} height={16} rx={8}
                fill="white" stroke="#e2e8f0" strokeWidth={0.8}
                opacity={isActive ? 1 : 0.85} />
              <text x={mx} y={my + 2} textAnchor="middle" className="fill-vfes-dark"
                style={{ fontSize: 9, fontWeight: 600 }}>
                {tt(e.label)}
              </text>
            </g>
          )
        })}

        {/* Nodes */}
        {[...positioned.values()].map(({ x, y, node }) => {
          const s = KIND_STYLE[node.kind]
          const isSelf = node.kind === 'self'
          const r = isSelf ? 34 : 26
          const isActive = active?.id === node.id
          return (
            <g
              key={node.id}
              transform={`translate(${x}, ${y})`}
              onMouseEnter={(ev) => {
                const rect = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()
                const px = (x / W) * rect.width
                const py = (y / H) * rect.height
                setHover({ node, x: px, y: py })
              }}
              onMouseLeave={() => setHover(null)}
              onClick={() => {
                if (node.vmCustomerId && onOpenCustomer && !isSelf) {
                  onOpenCustomer(node.vmCustomerId)
                } else {
                  setPinned(pinned?.id === node.id ? null : node)
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle r={r + 6} fill={s.ring} opacity={isActive ? 0.9 : 0.55} />
              <circle r={r} fill={s.fill} stroke={s.stroke} strokeWidth={isActive ? 3 : 1.5} />
              <text textAnchor="middle" y={isSelf ? 6 : 5}
                style={{ fontSize: isSelf ? 22 : 16, fontWeight: 700 }}
                fill="white">
                {s.icon}
              </text>
              <text textAnchor="middle" y={r + 14}
                className="fill-vfes-dark"
                style={{ fontSize: 10, fontWeight: 700 }}>
                {node.label.length > 22 ? node.label.slice(0, 20) + '…' : node.label}
              </text>
              {node.subtitle && (
                <text textAnchor="middle" y={r + 25}
                  className="fill-vfes-dark/55"
                  style={{ fontSize: 9 }}>
                  {node.subtitle.length > 30 ? node.subtitle.slice(0, 28) + '…' : node.subtitle}
                </text>
              )}
              {node.isCustomer && !isSelf && (
                <circle cx={r - 4} cy={-r + 4} r={5} fill="#10B981" stroke="white" strokeWidth={1.5}>
                  <title>{tt('Cable Bahamas customer — click to open')}</title>
                </circle>
              )}
            </g>
          )
        })}
      </svg>

      {/* Hover tooltip */}
      {hover && !pinned && (
        <div
          className="pointer-events-none absolute z-10 bg-white border border-black/10 rounded-lg shadow-lg p-3 text-xs"
          style={{
            left: Math.min(tipX + 14, 520),
            top: Math.max(tipY - 20, 8),
            width: 240,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: KIND_STYLE[hover.node.kind].fill }}
            />
            <div className="font-bold text-sm">{hover.node.label}</div>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55 mb-2">
            {KIND_STYLE[hover.node.kind].label}
          </div>
          <dl className="space-y-1">
            {hover.node.details.map((d, i) => (
              <div key={i} className="flex justify-between gap-3">
                <dt className="text-vfes-dark/60">{d.k}</dt>
                <dd className="font-semibold text-right">{d.v}</dd>
              </div>
            ))}
          </dl>
          {hover.node.isCustomer && hover.node.kind !== 'self' && (
            <div className="mt-2 pt-2 border-t border-black/5 text-[10px] text-emerald-700 font-bold">
              ● Cable Bahamas customer · click to open
            </div>
          )}
        </div>
      )}

      {/* Pinned details panel (after click on non-customer node) */}
      {pinned && (
        <div className="absolute top-3 right-3 w-64 bg-white border border-black/10 rounded-lg shadow-lg p-3 text-xs">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <div className="font-bold text-sm">{tt(pinned.label)}</div>
              <div className="text-[10px] uppercase tracking-widest text-vfes-dark/55">
                {KIND_STYLE[pinned.kind].label}
              </div>
            </div>
            <button onClick={() => setPinned(null)} className="text-vfes-dark/40 hover:text-vfes-dark">×</button>
          </div>
          <dl className="space-y-1 mt-2">
            {pinned.details.map((d, i) => (
              <div key={i} className="flex justify-between gap-3">
                <dt className="text-vfes-dark/60">{d.k}</dt>
                <dd className="font-semibold text-right">{d.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 right-2 bg-white/85 backdrop-blur-sm border border-black/5 rounded-md px-2 py-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
        {(['self', 'household', 'business', 'partner', 'authorised', 'address', 'referral'] as RelNodeKind[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: KIND_STYLE[k].fill }} />
            <span className="text-vfes-dark/70">{KIND_STYLE[k].label}</span>
          </span>
        ))}
        <span className="ml-auto text-vfes-dark/50">{tt('Hover for details · click ● to open linked customer')}</span>
      </div>
    </div>
  )
}
