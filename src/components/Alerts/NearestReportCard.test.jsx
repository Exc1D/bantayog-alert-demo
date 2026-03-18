import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NearestReportCard from './NearestReportCard';

const nearReport = {
  id: 'r1',
  disaster: { type: 'Flood', severity: 'critical' },
  location: { barangay: 'Brgy. Lag-on', municipality: 'Daet' },
  verification: { status: 'verified' },
  timestamp: { seconds: Math.floor(Date.now() / 1000) - 600 },
  distanceKm: 1.4,
};

describe('NearestReportCard', () => {
  it('renders nothing when no report', () => {
    const { container } = render(
      <MemoryRouter>
        <NearestReportCard report={null} />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders report type and location', () => {
    render(
      <MemoryRouter>
        <NearestReportCard report={nearReport} />
      </MemoryRouter>
    );
    expect(screen.getByText('Flood')).toBeInTheDocument();
    expect(screen.getByText(/Daet/i)).toBeInTheDocument();
  });

  it('renders distance', () => {
    render(
      <MemoryRouter>
        <NearestReportCard report={nearReport} />
      </MemoryRouter>
    );
    expect(screen.getByText(/1\.4/)).toBeInTheDocument();
  });

  it('links to report detail', () => {
    render(
      <MemoryRouter>
        <NearestReportCard report={nearReport} />
      </MemoryRouter>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/report/r1');
  });
});
