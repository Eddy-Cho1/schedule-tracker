import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error
      return (
        <div style={{ padding: 32, color: '#f87171', fontFamily: 'monospace', background: '#07070e', minHeight: '100vh' }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>앱 에러 발생</div>
          <div style={{ color: '#e8eaf0', marginBottom: 8 }}>{err.message}</div>
          <pre style={{ color: '#8892a4', fontSize: 11, whiteSpace: 'pre-wrap' }}>{err.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
