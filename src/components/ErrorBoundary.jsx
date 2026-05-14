import { Component } from 'react';

// Class component required — React error boundaries must use getDerivedStateFromError
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surface to console in dev; swap for a logging service (Sentry etc.) in production
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleReset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary__icon">⚠️</div>
        <h2 className="error-boundary__title">Something went wrong</h2>
        <p className="error-boundary__msg">
          This section hit an unexpected error. Try refreshing the page or head back to Today Mode.
        </p>
        <div className="error-boundary__actions">
          <button onClick={this.handleReset} className="btn btn-primary">
            Try again
          </button>
          <a href="/dashboard/today" className="btn btn-secondary">
            Back to Today Mode
          </a>
        </div>
      </div>
    );
  }
}
