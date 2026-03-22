import { render, screen } from '@testing-library/react';
import CriticalAlertBanner from './CriticalAlertBanner';

describe('CriticalAlertBanner', () => {
  it('renders nothing when no critical reports', () => {
    const { container } = render(<CriticalAlertBanner reports={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when only resolved critical reports', () => {
    const reports = [
      {
        id: '1',
        disaster: { type: 'Flood', severity: 'critical' },
        location: { municipality: 'Daet' },
        verification: { status: 'resolved' },
      },
    ];
    const { container } = render(<CriticalAlertBanner reports={reports} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner for unresolved critical report', () => {
    const reports = [
      {
        id: '1',
        disaster: { type: 'Flood', severity: 'critical' },
        location: { municipality: 'Daet' },
        verification: { status: 'verified' },
      },
    ];
    render(<CriticalAlertBanner reports={reports} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Flood/i)).toBeInTheDocument();
    expect(screen.getByText(/Daet/i)).toBeInTheDocument();
  });

  it('shows the most recent critical report', () => {
    const reports = [
      {
        id: '1',
        disaster: { type: 'Flood', severity: 'critical' },
        location: { municipality: 'Daet' },
        verification: { status: 'verified' },
        timestamp: { seconds: 1000 },
      },
      {
        id: '2',
        disaster: { type: 'Landslide', severity: 'critical' },
        location: { municipality: 'Labo' },
        verification: { status: 'pending' },
        timestamp: { seconds: 2000 },
      },
    ];
    render(<CriticalAlertBanner reports={reports} />);
    expect(screen.getByText(/Landslide/i)).toBeInTheDocument();
    expect(screen.getByText(/Labo/i)).toBeInTheDocument();
  });
});
