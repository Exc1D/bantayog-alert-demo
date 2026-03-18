import { render, screen } from '@testing-library/react';
import Header from './Header';

describe('Header', () => {
  it('renders app name', () => {
    render(<Header />);
    expect(screen.getByText('BANTAYOG ALERT')).toBeInTheDocument();
  });

  it('renders location when provided', () => {
    render(<Header location="Daet" />);
    expect(screen.getByText('Daet')).toBeInTheDocument();
  });

  it('renders nothing for location when not provided', () => {
    const { container } = render(<Header />);
    expect(container.querySelector('[data-testid="header-location"]')).toBeNull();
  });
});
