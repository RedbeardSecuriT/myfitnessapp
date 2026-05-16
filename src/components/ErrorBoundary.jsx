import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    this.setState({ error, info })
    console.error('App crash:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 32, color: '#e8f0f8', background: '#0f1923',
          minHeight: '100dvh', fontFamily: 'DM Sans, sans-serif'
        }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 13, color: 'rgba(232,240,248,.5)', marginBottom: 24, lineHeight: 1.6 }}>
            {this.state.error?.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#00c896', color: '#000', border: 'none',
              borderRadius: 12, padding: '14px 28px',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
              cursor: 'pointer', marginBottom: 16, display: 'block'
            }}>
            Reload app
          </button>
          <details style={{ fontSize: 11, color: 'rgba(232,240,248,.3)', marginTop: 16 }}>
            <summary style={{ cursor: 'pointer' }}>Technical details</summary>
            <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {this.state.info?.componentStack}
            </pre>
          </details>
        </div>
      )
    }
    return this.props.children
  }
}
