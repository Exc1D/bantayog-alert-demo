import { describe, it, expect } from 'vitest';
import { simpleRender as render, screen } from '../../test/utils.jsx';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders spinner element', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('svg');
    expect(spinner).toBeInTheDocument();
  });

  it('applies medium size by default', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('h-8', 'w-8');
  });

  it('applies small size correctly', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('h-5', 'w-5');
  });

  it('applies large size correctly', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  it('does not render text by default', () => {
    render(<LoadingSpinner />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('renders loading text when provided', () => {
    render(<LoadingSpinner text="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('has animation class', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('applies accent color class', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('text-accent');
  });
});
