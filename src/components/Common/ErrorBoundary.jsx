import { Component } from 'react';
import ErrorFallback from './ErrorFallback';

const logErrorToService = (error, errorInfo) => {
  console.error('Error caught by boundary:', error);
  console.error('Component stack:', errorInfo.componentStack);

  // Placeholder for error tracking service integration
  // Examples: Sentry, LogRocket, Bugsnag, etc.
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  // }
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent, onRetry, onGoHome, showDetails } = this.props;

      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={onRetry || this.handleRetry}
            onGoHome={onGoHome || this.handleGoHome}
            showDetails={showDetails}
          />
        );
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={onRetry || this.handleRetry}
          onGoHome={onGoHome || this.handleGoHome}
          showDetails={showDetails}
        />
      );
    }

    return this.props.children;
  }
}
