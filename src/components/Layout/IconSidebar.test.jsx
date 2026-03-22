import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import IconSidebar from './IconSidebar';

function renderSidebar(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <IconSidebar />
    </MemoryRouter>
  );
}

describe('IconSidebar', () => {
  it('renders a nav element with accessible label', () => {
    renderSidebar();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('renders 5 nav links (4 tabs + report shortcut)', () => {
    renderSidebar();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);
  });

  it('renders a report shortcut link', () => {
    renderSidebar();
    const reportLink = screen.getByRole('link', { name: /create report/i });
    expect(reportLink).toHaveAttribute('href', '/report');
  });

  it('active link on / has aria-current="page"', () => {
    renderSidebar('/');
    const mapLink = screen.getByRole('link', { name: /map/i });
    expect(mapLink).toHaveAttribute('aria-current', 'page');
  });

  it('active link on /feed has aria-current="page"', () => {
    renderSidebar('/feed');
    const feedLink = screen.getByRole('link', { name: /feed/i });
    expect(feedLink).toHaveAttribute('aria-current', 'page');
  });

  it('inactive links do not have aria-current', () => {
    renderSidebar('/feed');
    const mapLink = screen.getByRole('link', { name: /map/i });
    expect(mapLink).not.toHaveAttribute('aria-current', 'page');
  });
});
