import { Link } from 'react-router-dom'
import { Brain, Gauge } from 'lucide-react'
import { Panel } from './Panel'
import AgentDecision from './AgentDecision'
import tt from '../i18n/tt'
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, Cell, Area, AreaChart, Line, LineChart,
} from 'recharts'

export type MlModel = { name: string; metric: string; sub: string }
export type MlSeries = { key: string; name: string; color: string; dashed?: boolean }
export type MlChart = {
  kind: 'bar' | 'line' | 'area'
  title: string
  data: any[]
  xKey: string
  series: MlSeries[]
  unit?: string
  note?: string
  // bar-only: per-bar colors based on first series value thresholds
  colorBy?: { key: string; high: number; mid: number }
}
export type MlDecision = {
  title: string; detail: string; impact?: string; risk?: string; linkTo?: string; linkLabel?: string
}

type Props = {
  heading?: string
  models: MlModel[]
  agentLabel: string
  agentRunningLabel?: string
  agentSteps: string[]
  agentBlurb: string
  decision: MlDecision
  chart: MlChart
  registryNote?: string
  // Board/exec view: hide the technical model-cards strip (recall/MAPE) and the
  // Model Registry / Feature Store footer. Keeps the agent recommendation + chart.
  hideModels?: boolean
}

const GREEN = '#10B981', AMBER = '#F59E0B', RED = '#EF4444'
const BLUE = '#FF4438', NAVY = '#11567F', PURPLE = '#7C3AED'

// Per-domain accent so the section looks distinct on each page (not a repeated template).
function accentFor(heading: string): string {
  const h = heading.toLowerCase()
  if (h.includes('incident')) return RED
  if (h.includes('workforce')) return GREEN
  if (h.includes('risk')) return AMBER
  if (h.includes('strategy')) return NAVY
  if (h.includes('compliance')) return PURPLE
  if (h.includes('procurement')) return '#0EA5A4'
  if (h.includes('billing')) return '#2563EB'
  return BLUE // executive & default
}

function renderChart(chart: MlChart) {
  const { kind, data, xKey, series, unit } = chart
  if (kind === 'bar') {
    return (
      <BarChart data={data}>
        <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
        <XAxis dataKey={xKey} stroke="#999" fontSize={10} />
        <YAxis stroke="#999" fontSize={11} unit={unit} />
        <Tooltip contentStyle={{ fontSize: 12 }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[6, 6, 0, 0]} name={tt(s.name)}>
            {chart.colorBy && s.key === chart.colorBy.key
              ? data.map((d, i) => (
                  <Cell key={i} fill={d[chart.colorBy!.key] >= chart.colorBy!.high ? RED : d[chart.colorBy!.key] >= chart.colorBy!.mid ? AMBER : GREEN} />
                ))
              : null}
          </Bar>
        ))}
      </BarChart>
    )
  }
  if (kind === 'area') {
    return (
      <AreaChart data={data}>
        <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
        <XAxis dataKey={xKey} stroke="#999" fontSize={11} />
        <YAxis stroke="#999" fontSize={11} unit={unit} />
        <Tooltip contentStyle={{ fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {series.map((s) => (
          <Area key={s.key} type="monotone" dataKey={s.key} stroke={s.color} fill={s.color} fillOpacity={0.2} name={tt(s.name)} />
        ))}
      </AreaChart>
    )
  }
  return (
    <LineChart data={data}>
      <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
      <XAxis dataKey={xKey} stroke="#999" fontSize={11} />
      <YAxis stroke="#999" fontSize={11} unit={unit} />
      <Tooltip contentStyle={{ fontSize: 12 }} />
      <Legend wrapperStyle={{ fontSize: 11 }} />
      {series.map((s) => (
        <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2.4} strokeDasharray={s.dashed ? '4 4' : undefined} name={tt(s.name)} dot={false} />
      ))}
    </LineChart>
  )
}

export default function MlInsightSection(props: Props) {
  const { heading = 'Machine learning', models, agentLabel, agentRunningLabel = 'Scoring…', agentSteps, agentBlurb, decision, chart, registryNote, hideModels } = props
  const accent = accentFor(heading)
  return (
    <div className="mb-6">
      {!hideModels && (
      <Panel title={`${tt(heading)} · ${tt('ML models')}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {models.map((m) => (
            <div key={m.name} className="rounded-xl border border-black/5 bg-[#fafbfc] p-3 border-l-4" style={{ borderLeftColor: accent }}>
              <div className="flex items-center gap-2 mb-1"><Brain className="w-3.5 h-3.5" style={{ color: accent }} /><span className="text-[12px] font-bold text-vfes-dark">{tt(m.name)}</span></div>
              <div className="text-lg font-extrabold" style={{ color: accent }}>{m.metric}</div>
              <div className="text-[10px] text-vfes-dark/55">{tt(m.sub)}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-vfes-dark/55 flex items-center gap-1">
          <Gauge className="w-3 h-3" /> {tt(registryNote || 'Trained in Snowflake ML, served from the Model Registry, features from the Feature Store.')}
          <Link to="/portal/ml-registry" className="font-semibold ml-1" style={{ color: accent }}>{tt('Open ML Registry')} →</Link>
        </div>
      </Panel>
      )}

      <AgentDecision
        title={heading + ' agent'}
        label={agentLabel}
        runningLabel={agentRunningLabel}
        steps={agentSteps}
        hint={agentBlurb}
        result={{
          headline: decision.title,
          stats: [
            ...(decision.impact ? [{ label: 'Impact', value: tt(decision.impact) }] : []),
            ...(!hideModels ? [{ label: 'Models', value: String(models.length) }] : []),
            { label: 'Confidence', value: 'High' },
          ],
          findings: [
            decision.detail,
            ...(chart.note ? [chart.note] : []),
            ...(decision.risk ? ['Guardrail: ' + decision.risk] : []),
          ],
          note: 'Recommendation ready — routed to owners; full rationale revealed above.',
        }}
        impact={decision.impact}
        risk={decision.risk}
        linkTo={decision.linkTo}
        linkLabel={decision.linkLabel}
      />

      <div className="mt-4">
        <Panel title={tt(chart.title)}>
          <div className="h-64">
            <ResponsiveContainer>
              {renderChart(chart)}
            </ResponsiveContainer>
          </div>
          {chart.note && <div className="mt-3 text-xs text-vfes-dark/55">{tt(chart.note)}</div>}
        </Panel>
      </div>
    </div>
  )
}
