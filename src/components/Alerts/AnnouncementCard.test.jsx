import { describe, it, expect } from 'vitest';
import { simpleRender as render, screen } from '../../test/utils.jsx';
import AnnouncementCard from './AnnouncementCard';

const mockAnnouncement = {
  id: 'test-1',
  type: 'class-suspension',
  title: 'Classes suspended in Daet',
  body: 'All public and private schools in Daet are suspended tomorrow.',
  severity: 'critical',
  scope: 'Daet',
  createdAt: { toDate: () => new Date('2026-03-15') },
};

describe('AnnouncementCard', () => {
  it('renders announcement title and body', () => {
    render(<AnnouncementCard announcement={mockAnnouncement} />);
    expect(screen.getByText('Classes suspended in Daet')).toBeInTheDocument();
    expect(screen.getByText(/All public and private schools/)).toBeInTheDocument();
  });

  it('shows correct severity styling for critical', () => {
    render(<AnnouncementCard announcement={mockAnnouncement} />);
    const card = screen.getByText('Classes suspended in Daet').closest('[class*="border"]');
    expect(card).toHaveClass('border-red-500');
  });
});
