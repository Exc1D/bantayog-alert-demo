import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AnnouncementItem from './AnnouncementItem';

const mockAnnouncement = {
  id: 'test-1',
  type: 'class-suspension',
  title: 'Classes suspended in Daet',
  body: 'All public and private schools in Daet are suspended tomorrow.',
  severity: 'critical',
  scope: 'Daet',
  createdAt: { toDate: () => new Date('2026-03-15') },
};

describe('AnnouncementItem', () => {
  it('renders announcement details', () => {
    render(
      <BrowserRouter>
        <AnnouncementItem
          announcement={mockAnnouncement}
          canDeactivate={true}
          onUpdate={jest.fn()}
        />
      </BrowserRouter>
    );
    expect(screen.getByText('Classes suspended in Daet')).toBeInTheDocument();
    expect(screen.getByText(/All public and private schools/)).toBeInTheDocument();
  });

  it('hides Deactivate button when canDeactivate is false', () => {
    render(
      <BrowserRouter>
        <AnnouncementItem
          announcement={mockAnnouncement}
          canDeactivate={false}
          onUpdate={jest.fn()}
        />
      </BrowserRouter>
    );
    expect(screen.queryByText('Deactivate')).not.toBeInTheDocument();
  });

  it('shows Deactivate button when canDeactivate is true', () => {
    render(
      <BrowserRouter>
        <AnnouncementItem
          announcement={mockAnnouncement}
          canDeactivate={true}
          onUpdate={jest.fn()}
        />
      </BrowserRouter>
    );
    expect(screen.getByText('Deactivate')).toBeInTheDocument();
  });
});
