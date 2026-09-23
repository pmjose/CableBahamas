import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

type Props = { children: ReactNode }
type State = { hasError: boolean; error?: Error }

// Per-route error boundary: if a single page throws at runtime, show a contained
// fallback instead of white-screening the whole demo.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('Page error captured by ErrorBoundary:', error, info)
  }

  reset = () => this.setState({ hasError: false, error: undefined })

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="p-8">
        <div className="max-w-lg mx-auto mt-16 bg-white rounded-2xl border border-black/5 shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 grid place-items-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-vfes-dark mb-1">This page hit an error</h2>
          <p className="text-sm text-vfes-dark/55 mb-5">
            The rest of the portal is unaffected — pick another page from the sidebar or ⌘K, or retry.
          </p>
          {this.state.error && (
            <pre className="text-[11px] text-left bg-[#f6f7fb] rounded-lg p-3 mb-5 overflow-x-auto text-vfes-dark/60">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.reset}
            className="inline-flex items-center gap-2 bg-vfes-red hover:bg-vfes-red-dark text-vfes-dark font-bold px-4 py-2 rounded-lg text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    )
  }
}
