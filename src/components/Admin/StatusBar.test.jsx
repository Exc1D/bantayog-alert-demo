import { render, screen } from '@testing-library/react';
import StatusBar from './StatusBar';

describe('StatusBar', () => {
  it('shows pending count', () => {
    render(<StatusBar pending={5} criticalActive={2} totalActive={8} resolvedToday={3} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('shows critical active count', () => {
    render(<StatusBar pending={0} criticalActive={3} totalActive={5} resolvedToday={1} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
  });

  it('shows resolved today count', () => {
    render(<StatusBar pending={0} criticalActive={0} totalActive={2} resolvedToday={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText(/resolved/i)).toBeInTheDocument();
  });

  it('shows total active count', () => {
    render(<StatusBar pending={0} criticalActive={0} totalActive={10} resolvedToday={0} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText(/total/i)).toBeInTheDocument();
  });
});
