import { createLogger } from '@hoolsy/logger';
import React from 'react';

const logger = createLogger('ErrorBoundary');

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error?: Error }
> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('Caught error:', error, info);
  }

  private reset = () => {
    this.setState({ error: undefined });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const message = String(error?.message ?? error);
    const stack = String(error?.stack ?? '');
    return (
      <div
        style={{
          padding: 16,
          margin: 16,
          borderRadius: 12,
          background: '#fee2e2',
          color: '#991b1b',
          fontFamily: 'ui-sans-serif',
        }}
      >
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
        >
          <h2 style={{ fontWeight: 700, margin: 0 }}>Something crashed</h2>
          <button
            onClick={this.reset}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #fecaca',
              background: '#fff',
              color: '#991b1b',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
        <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>
          {message}
          {'\n'}
          {stack}
        </pre>
      </div>
    );
  }
}
