import { useState } from 'react'
import { PageHeader } from '../../components/Panel'
import AgentWorkflow from '../../components/AgentWorkflow'
import tt from '../../i18n/tt'
import { AGENT_FLOWS } from './_agent_flows'

export default function AgenticWorkflowsPage() {
  const [active, setActive] = useState(AGENT_FLOWS[0].id)
  const flow = AGENT_FLOWS.find(f => f.id === active)!

  return (
    <div>
      <PageHeader
        title="Agentic Workflows"
        subtitle="Event-triggered agents that plan, call governed tools, wait for human approval, act and leave an audit trail"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        {[
          ['1 · Trigger', 'An event starts the agent: storm advisory, alarm, chat intent, RFQ, reconciliation break or deadline.'],
          ['2 · Plan + tools', 'The agent plans steps and calls read-only tools: semantic views, ML models, Cortex Search runbooks.'],
          ['3 · Human approval', 'Customer-facing or financial actions stop at a named approver with explicit guardrails.'],
          ['4 · Act + audit', 'Approved actions are executed in downstream systems and every step is logged.'],
        ].map(([h, b]) => (
          <div key={h} className="rounded-xl bg-white border border-black/5 p-4">
            <div className="text-xs font-bold text-vfes-dark">{tt(h)}</div>
            <div className="text-[11px] text-vfes-dark/60 mt-1">{tt(b)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {AGENT_FLOWS.map(f => (
          <button
            key={f.id}
            onClick={() => setActive(f.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${active === f.id ? 'bg-vfes-red text-vfes-dark shadow' : 'bg-black/5 text-vfes-dark/70 hover:bg-black/10'}`}
          >
            {tt(f.title.split(' · ')[0])}
          </button>
        ))}
      </div>

      <AgentWorkflow key={flow.id} flow={flow} />

      <div className="mt-3 text-[11px] text-vfes-dark/50">
        {tt('Also embedded on its home page')}:{' '}
        <a href={`#/portal/${flow.home}`} className="font-semibold text-vfes-dark hover:underline">/{flow.home}</a>
      </div>
    </div>
  )
}
