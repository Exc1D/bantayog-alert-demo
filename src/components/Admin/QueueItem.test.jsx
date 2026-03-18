import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QueueItem from './QueueItem';

const report = {
  id: 'r1',
  disaster: {
    type: 'Flood',
    severity: 'critical',
    description: 'Water rising near municipal bridge.',
  },
  location: { municipality: 'Daet' },
  timestamp: { seconds: Math.floor(Date.now() / 1000) - 300 },
  media: { photos: ['https://example.com/1.jpg', 'https://example.com/2.jpg'] },
};

function renderItem(props = {}) {
  return render(
    <MemoryRouter>
      <QueueItem report={report} onVerify={vi.fn()} onReject={vi.fn()} {...props} />
    </MemoryRouter>
  );
}

describe('QueueItem', () => {
  it('renders disaster type and municipality', () => {
    renderItem();
    expect(screen.getByText('Flood')).toBeInTheDocument();
    expect(screen.getByText(/Daet/i)).toBeInTheDocument();
  });

  it('renders photo count', () => {
    renderItem();
    expect(screen.getByText(/2 photos/i)).toBeInTheDocument();
  });

  it('calls onVerify when Verify button is clicked', () => {
    const onVerify = vi.fn();
    renderItem({ onVerify });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    expect(onVerify).toHaveBeenCalledWith('r1');
  });

  it('calls onReject when Reject button is clicked', () => {
    const onReject = vi.fn();
    renderItem({ onReject });
    fireEvent.click(screen.getByRole('button', { name: /reject/i }));
    expect(onReject).toHaveBeenCalledWith('r1');
  });

  it('links card body to report detail', () => {
    renderItem();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/admin/report/r1');
  });
});
