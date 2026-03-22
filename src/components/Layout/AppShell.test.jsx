import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mockUseIsLg = vi.fn(() => false);
vi.mock('../../hooks/useIsLg', () => ({ default: () => mockUseIsLg() }));
vi.mock('../Map/PersistentMapPanel', () => ({
  default: () => <div data-testid="persistent-map-panel" />,
}));
vi.mock('./EnhancedSidebar', () => ({
  default: () => <nav aria-label="enhanced sidebar" data-testid="enhanced-sidebar" />,
}));
vi.mock('./IconSidebar', () => ({
  default: () => <nav aria-label="icon sidebar" data-testid="icon-sidebar" />,
}));
vi.mock('../RightPanel/RightPanel', () => ({
  default: () => <div data-testid="right-panel">RightPanel</div>,
}));
vi.mock('../RightPanel/FeedPanel', () => ({ default: () => <div>FeedPanel</div> }));
vi.mock('../RightPanel/AlertsPanel', () => ({ default: () => <div>AlertsPanel</div> }));
vi.mock('../RightPanel/DataPanel', () => ({ default: () => <div>DataPanel</div> }));
vi.mock('../RightPanel/IncidentDetail', () => ({ default: () => <div>IncidentDetail</div> }));

import AppShell from './AppShell';

function renderAppShell(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<div>Map content</div>} />
          <Route path="/feed" element={<div>Feed content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

function renderAppShellWithMapMode(mapMode) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppShell initialMapMode={mapMode} />}>
          <Route path="/" element={<div>Map content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.getItem.mockReturnValue(null);
    mockUseIsLg.mockReturnValue(false);
  });

  it('renders header', () => {
    renderAppShell();
    expect(screen.getByText('BANTAYOG ALERT')).toBeInTheDocument();
  });

  it('renders tab navigation', () => {
    renderAppShell();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('renders outlet content on mobile', () => {
    renderAppShell('/');
    expect(screen.getByText('Map content')).toBeInTheDocument();
  });

  it('renders feed content on /feed', () => {
    renderAppShell('/feed');
    expect(screen.getByText('Feed content')).toBeInTheDocument();
  });

  it('does not render map content on /feed', () => {
    renderAppShell('/feed');
    expect(screen.queryByText('Map content')).not.toBeInTheDocument();
  });

  describe('desktop layout (lg+)', () => {
    beforeEach(() => {
      mockUseIsLg.mockReturnValue(true);
    });

    it('renders EnhancedSidebar on lg screens', () => {
      renderAppShell();
      expect(screen.getByTestId('enhanced-sidebar')).toBeInTheDocument();
    });

    it('renders PersistentMapPanel on lg screens', () => {
      renderAppShellWithMapMode('pins');
      expect(screen.getByTestId('persistent-map-panel')).toBeInTheDocument();
    });

    it('renders RightPanel on desktop (replaces Outlet)', () => {
      renderAppShellWithMapMode('pins');
      expect(screen.getByTestId('right-panel')).toBeInTheDocument();
    });

    it('hides main content when mapMode === full', () => {
      renderAppShellWithMapMode('full');
      expect(screen.getByRole('main')).toHaveClass('hidden');
    });

    it('renders resize divider when mapMode is pins', () => {
      renderAppShellWithMapMode('pins');
      expect(screen.getByRole('separator')).toBeInTheDocument();
    });

    it('does not render resize divider when mapMode is hidden', () => {
      renderAppShellWithMapMode('hidden');
      expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    });
  });
});
