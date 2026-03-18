import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminGuard from './AdminGuard';

// Mock auth context
vi.mock('../../contexts/AuthContext', () => ({
  useAuthContext: vi.fn(),
}));

import { useAuthContext } from '../../contexts/AuthContext';

function renderWithRouter(authState, path = '/admin') {
  useAuthContext.mockReturnValue(authState);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<div>Admin content</div>} />
        </Route>
        <Route path="/profile" element={<div>Profile page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminGuard', () => {
  it('shows spinner while auth is loading', () => {
    renderWithRouter({ loading: true, userProfile: null });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to /profile when user is not admin', () => {
    renderWithRouter({ loading: false, userProfile: { role: 'user' } });
    expect(screen.getByText('Profile page')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('redirects to /profile when user is not logged in', () => {
    renderWithRouter({ loading: false, userProfile: null });
    expect(screen.getByText('Profile page')).toBeInTheDocument();
  });

  it('renders admin content for admin_* role', () => {
    renderWithRouter({ loading: false, userProfile: { role: 'admin_daet' } });
    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('renders admin content for superadmin_provincial role', () => {
    renderWithRouter({ loading: false, userProfile: { role: 'superadmin_provincial' } });
    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });
});
