'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { captureClientError } from '@/lib/ops/captureError';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  surface?: string;
  onReset?: () => void;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureClientError(error, {
      surface: this.props.surface ?? 'error-boundary',
      componentStack: info.componentStack ?? undefined,
    });
  }

  private handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 text-center"
          role="alert"
        >
          <p className="text-sm font-medium text-[var(--text-primary)]">This section failed to load</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {this.state.error.message || 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-3 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
