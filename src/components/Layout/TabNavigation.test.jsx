import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TabNavigation from './TabNavigation';

function renderWithRouter(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TabNavigation />
    </MemoryRouter>
  );
}

describe('TabNavigation', () => {
  it('renders all 4 tabs', () => {
    renderWithRouter();
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Feed')).toBeInTheDocument();
    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('tab links point to correct hrefs', () => {
    renderWithRouter();
    expect(screen.getByRole('link', { name: /map/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /feed/i })).toHaveAttribute('href', '/feed');
    expect(screen.getByRole('link', { name: /weather/i })).toHaveAttribute('href', '/weather');
    expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/profile');
  });

  it('marks active tab when on / route', () => {
    renderWithRouter('/');
    const mapLink = screen.getByRole('link', { name: /map/i });
    expect(mapLink).toHaveAttribute('aria-current', 'page');
  });

  it('marks active tab when on /feed route', () => {
    renderWithRouter('/feed');
    const feedLink = screen.getByRole('link', { name: /feed/i });
    expect(feedLink).toHaveAttribute('aria-current', 'page');
  });
});
