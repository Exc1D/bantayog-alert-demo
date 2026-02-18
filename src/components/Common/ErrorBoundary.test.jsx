import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { simpleRender as render, screen, fireEvent } from '../../test/utils.jsx';
import ErrorBoundary from './ErrorBoundary';
import ErrorFallback from './ErrorFallback';

const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal content</div>;
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders fallback UI when an error is thrown', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
  });

  it('calls console.error when error is caught', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('shows Try Again button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('shows Go Home button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
  });

  it('resets error state when Try Again is clicked', () => {
    const handleRetry = vi.fn();

    render(
      <ErrorBoundary onRetry={handleRetry}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(handleRetry).toHaveBeenCalled();
  });

  it('navigates to home when Go Home is clicked', () => {
    delete window.location;
    window.location = { href: '' };

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /go home/i }));

    expect(window.location.href).toBe('/');
  });

  it('renders custom fallback component', () => {
    const CustomFallback = ({ error }) => (
      <div>Custom error: {error.message}</div>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    render(
      <ErrorBoundary showDetails={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details')).toBeInTheDocument();
  });

  it('accepts custom onRetry handler', () => {
    const handleRetry = vi.fn();

    render(
      <ErrorBoundary onRetry={handleRetry}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(handleRetry).toHaveBeenCalled();
  });

  it('accepts custom onGoHome handler', () => {
    const handleGoHome = vi.fn();

    render(
      <ErrorBoundary onGoHome={handleGoHome}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /go home/i }));
    expect(handleGoHome).toHaveBeenCalled();
  });
});

describe('ErrorFallback', () => {
  it('renders with error message', () => {
    render(
      <ErrorFallback error={{ message: 'Test error' }} />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders retry button when onRetry provided', () => {
    render(
      <ErrorFallback error={{ message: 'Test error' }} onRetry={() => {}} />
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('does not render retry button when onRetry not provided', () => {
    render(
      <ErrorFallback error={{ message: 'Test error' }} />
    );

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('renders go home button when onGoHome provided', () => {
    render(
      <ErrorFallback error={{ message: 'Test error' }} onGoHome={() => {}} />
    );

    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
  });

  it('shows error details when showDetails is true', () => {
    render(
      <ErrorFallback 
        error={{ message: 'Test error', stack: 'Error stack trace' }} 
        showDetails={true} 
      />
    );

    expect(screen.getByText('Error Details')).toBeInTheDocument();
  });

  it('calls onRetry when Try Again is clicked', () => {
    const handleRetry = vi.fn();

    render(
      <ErrorFallback error={{ message: 'Test error' }} onRetry={handleRetry} />
    );

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(handleRetry).toHaveBeenCalled();
  });

  it('calls onGoHome when Go Home is clicked', () => {
    const handleGoHome = vi.fn();

    render(
      <ErrorFallback error={{ message: 'Test error' }} onGoHome={handleGoHome} />
    );

    fireEvent.click(screen.getByRole('button', { name: /go home/i }));
    expect(handleGoHome).toHaveBeenCalled();
  });
});