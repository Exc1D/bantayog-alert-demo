import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

const mockUseIsLg = vi.fn(() => false);
vi.mock('../../hooks/useIsLg', () => ({ default: () => mockUseIsLg() }));
vi.mock('../Map/PersistentMapPanel', () => ({
  default: () => <div data-testid="persistent-map-panel" />,
}));
vi.mock('./IconSidebar', () => ({
  default: () => <nav aria-label="icon sidebar" data-testid="icon-sidebar" />,
}));

import AppShell from './AppShell';
import { useMapPanel } from '../../contexts/MapPanelContext';

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
        <Route element={<AppShell />}>
          <Route path="/" element={<MapModeSetter mapMode={mapMode} />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AppShell', () => {
  beforeEach(() => {
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

    it('renders IconSidebar and not TabNavigation on lg screens', () => {
      renderAppShell();
      expect(screen.getByTestId('icon-sidebar')).toBeInTheDocument();
      expect(
        screen.queryByRole('navigation', { name: /main navigation/i })
      ).not.toBeInTheDocument();
    });

    it('renders PersistentMapPanel on lg screens', () => {
      renderAppShell();
      expect(screen.getByTestId('persistent-map-panel')).toBeInTheDocument();
    });

    it('renders TabNavigation and not IconSidebar on mobile', () => {
      mockUseIsLg.mockReturnValue(false);
      renderAppShell();
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
      expect(screen.queryByTestId('icon-sidebar')).not.toBeInTheDocument();
    });

    it("hides main content when mapMode === 'full'", () => {
      renderAppShellWithMapMode('full');
      expect(screen.getByRole('main')).toHaveClass('hidden');
    });
  });
});
