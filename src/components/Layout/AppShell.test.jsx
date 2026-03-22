import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

const mockUseIsLg = vi.fn(() => false);
vi.mock('../../hooks/useIsLg', () => ({ default: () => mockUseIsLg() }));
vi.mock('../Map/PersistentMapPanel', () => ({
  default: () => <div data-testid="persistent-map-panel" />,
}));
vi.mock('./EnhancedSidebar', () => ({
  default: () => <nav aria-label="enhanced sidebar" data-testid="enhanced-sidebar" />,
}));

import AppShell from './AppShell';
import { useMapPanel, MapPanelProvider } from '../../contexts/MapPanelContext';

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

function MapModeSetter({ mapMode }) {
  const { setMapMode } = useMapPanel();
  useEffect(() => setMapMode(mapMode), [mapMode, setMapMode]);
  return <div>Full map content</div>;
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

  it('renders outlet content', () => {
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

    it('renders EnhancedSidebar and not TabNavigation on lg screens', () => {
      renderAppShell();
      expect(screen.getByTestId('enhanced-sidebar')).toBeInTheDocument();
      expect(
        screen.queryByRole('navigation', { name: /main navigation/i })
      ).not.toBeInTheDocument();
    });

    it('renders PersistentMapPanel on lg screens', () => {
      renderAppShellWithMapMode('pins');
      expect(screen.getByTestId('persistent-map-panel')).toBeInTheDocument();
    });

    it('renders TabNavigation and not EnhancedSidebar on mobile', () => {
      mockUseIsLg.mockReturnValue(false);
      renderAppShell();
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
      expect(screen.queryByTestId('enhanced-sidebar')).not.toBeInTheDocument();
    });

    it("hides main content when mapMode === 'full'", () => {
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
