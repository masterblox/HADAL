import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[HADAL ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{
          padding: 24,
          background: 'var(--bg)',
          border: '1px solid var(--warn)',
          fontFamily: 'var(--MONO)',
          fontSize: 'var(--fs-med)',
          color: 'var(--warn)',
        }}>
          <div style={{ fontFamily: 'var(--MONO)', fontWeight: 400, fontSize: 'var(--fs-big)', marginBottom: 8, letterSpacing: '.02em' }}>
            SYSTEM ERROR
          </div>
          <div style={{ color: 'var(--g5)', marginBottom: 12 }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              fontFamily: 'var(--MONO)',
              fontSize: 'var(--fs-small)',
              letterSpacing: '.02em',
              fontWeight: 400,
              color: 'var(--g)',
              background: 'var(--g07)',
              border: '1px solid var(--g15)',
              padding: '6px 16px',
              cursor: 'pointer',
            }}
          >
            RETRY
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
