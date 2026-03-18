import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
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

describe('AppShell', () => {
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
});
