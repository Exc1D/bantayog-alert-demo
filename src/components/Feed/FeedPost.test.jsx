import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FeedPost from './FeedPost';

const baseReport = {
  id: 'r1',
  disaster: {
    type: 'Flood',
    severity: 'critical',
    description: 'Water rising near the bridge.',
  },
  location: { barangay: 'Brgy. Camambugan', municipality: 'Daet' },
  verification: { status: 'verified' },
  timestamp: { seconds: Math.floor(Date.now() / 1000) - 60 },
  photoUrls: [],
  upvotes: [],
  reporter: { name: 'Juan dela Cruz' },
};

function renderPost(report = baseReport) {
  return render(
    <MemoryRouter>
      <FeedPost report={report} />
    </MemoryRouter>
  );
}

describe('FeedPost', () => {
  it('renders disaster type', () => {
    renderPost();
    expect(screen.getByText('Flood')).toBeInTheDocument();
  });

  it('renders location', () => {
    renderPost();
    expect(screen.getByText(/Brgy. Camambugan/i)).toBeInTheDocument();
  });

  it('renders description', () => {
    renderPost();
    expect(screen.getByText(/Water rising/i)).toBeInTheDocument();
  });

  it('renders "View full report" link', () => {
    renderPost();
    const link = screen.getByRole('link', { name: /view full report/i });
    expect(link).toHaveAttribute('href', '/report/r1');
  });

  it('shows resolved badge when status is resolved', () => {
    const resolved = {
      ...baseReport,
      verification: {
        status: 'resolved',
        resolution: {
          resolvedAt: { seconds: Date.now() / 1000 },
          resolvedBy: 'MDRRMO',
        },
      },
    };
    renderPost(resolved);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('shows "View resolution" link when resolved', () => {
    const resolved = {
      ...baseReport,
      verification: {
        status: 'resolved',
        resolution: { resolvedAt: { seconds: Date.now() / 1000 } },
      },
    };
    renderPost(resolved);
    expect(screen.getByRole('button', { name: /view resolution/i })).toBeInTheDocument();
  });

  it('does not show resolved content for unresolved report', () => {
    renderPost();
    expect(screen.queryByText('Resolved')).not.toBeInTheDocument();
  });
});
