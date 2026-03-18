import { render, screen } from '@testing-library/react';
import App from './App';

// Mock all lazy-loaded pages to avoid loading full components
vi.mock('./pages/MapTab', () => ({ default: () => <div>Map</div> }));
vi.mock('./pages/FeedTab', () => ({ default: () => <div>Feed</div> }));
vi.mock('./pages/AlertsTab', () => ({ default: () => <div>Alerts</div> }));
vi.mock('./pages/ProfileTab', () => ({ default: () => <div>Profile</div> }));
vi.mock('./components/Admin/AdminShell', () => ({ default: () => <div>Admin</div> }));

// Mock contexts that depend on Firebase or localStorage
vi.mock('./contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }) => <>{children}</>,
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuthContext: () => ({ user: null, userProfile: null, loading: false }),
  default: null,
}));

vi.mock('./contexts/ReportsContext', () => ({
  ReportsProvider: ({ children }) => <>{children}</>,
  useReportsContext: () => ({ reports: [], loading: false, error: null }),
  default: null,
}));

describe('App', () => {
  it('renders without crashing', async () => {
    render(<App />);
    expect(await screen.findByText('BANTAYOG ALERT')).toBeInTheDocument();
  });

  it('renders tab navigation', async () => {
    render(<App />);
    expect(await screen.findByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });
});
