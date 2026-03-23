import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020408',
          color: '#cde',
          fontFamily: "'Segoe UI', monospace",
          padding: 40,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16, color: '#ff4444' }}>⚠</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#ff6666' }}>Something went wrong</h1>
        <p style={{ fontSize: 13, color: '#8ac', marginBottom: 24, maxWidth: 500 }}>
          The game encountered an unexpected error. You can try restarting.
        </p>
        <pre
          style={{
            fontSize: 11,
            color: '#f88',
            background: '#0a1020',
            padding: '12px 20px',
            borderRadius: 8,
            maxWidth: '80vw',
            maxHeight: 120,
            overflow: 'auto',
            marginBottom: 24,
            border: '1px solid #1a3050',
          }}
        >
          {this.state.error?.message}
        </pre>
        <button
          onClick={this.handleReset}
          style={{
            padding: '10px 32px',
            fontSize: 14,
            fontWeight: 700,
            background: '#4488ff',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            letterSpacing: 1,
          }}
        >
          RESTART
        </button>
      </div>
    );
  }
}
