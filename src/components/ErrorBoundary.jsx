import { Component } from 'react';

// Class component required — React error boundaries must use getDerivedStateFromError
export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
    this.setState({ errorInfo: info });
  }

  handleReset = () => this.setState({ hasError: false, error: null, errorInfo: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, errorInfo } = this.state;
    const isDev = import.meta.env.DEV;

    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary__icon">⚠️</div>
        <h2 className="error-boundary__title">Something went wrong</h2>
        <p className="error-boundary__msg">
          This section hit an unexpected error. Try refreshing or go back to the home page.
        </p>

        {isDev && error && (
          <details className="error-boundary__details">
            <summary>Error details</summary>
            <pre className="error-boundary__trace">
              {error.message}
              {errorInfo?.componentStack}
            </pre>
          </details>
        )}

        <div className="error-boundary__actions">
          <button onClick={this.handleReset} className="btn btn-primary">
            Try again
          </button>
          <a href="/" className="btn btn-secondary">
            Back to home
          </a>
        </div>
      </div>
    );
  }
}
