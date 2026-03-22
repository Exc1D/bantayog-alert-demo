import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EnhancedSidebar from './EnhancedSidebar';

describe('EnhancedSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
  };

  it('renders expanded by default (when isCollapsed=false)', () => {
    renderWithRouter(<EnhancedSidebar isCollapsed={false} onToggle={() => {}} />);
    // Should show the "Bantayog" brand text
    expect(screen.getByText('Bantayog')).toBeInTheDocument();
    // Should show tab labels
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Feed')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('collapses sidebar when toggle button is clicked', () => {
    const onToggle = vi.fn();
    renderWithRouter(<EnhancedSidebar isCollapsed={false} onToggle={onToggle} />);

    // Find the toggle button (chevron)
    const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows icons only when collapsed', () => {
    renderWithRouter(<EnhancedSidebar isCollapsed={true} onToggle={() => {}} />);

    // Brand text should not be visible
    expect(screen.queryByText('Bantayog')).not.toBeInTheDocument();
    // Labels should not be visible (but aria-label exists on navlinks)
    expect(screen.queryByText('Map')).not.toBeInTheDocument();
    // But icons are present (SVGs). We can check that navlinks still exist
    const mapLink = screen.getByRole('link', { name: /Map/i });
    expect(mapLink).toBeInTheDocument();
  });

  it('shows tooltip title attribute when collapsed', () => {
    renderWithRouter(<EnhancedSidebar isCollapsed={true} onToggle={() => {}} />);

    const mapLink = screen.getByRole('link', { name: /Map/i });
    expect(mapLink).toHaveAttribute('title', 'Map');
  });

  it('active tab has red left border and urgent styling', () => {
    render(
      <MemoryRouter initialEntries={['/alerts']}>
        <EnhancedSidebar isCollapsed={false} onToggle={() => {}} />
      </MemoryRouter>
    );

    const alertsLink = screen.getByRole('link', { name: /Alerts/i });
    // It should have the active classes: border-r-2 border-urgent and bg-urgent/5
    expect(alertsLink).toHaveClass('border-r-2');
    expect(alertsLink).toHaveClass('border-urgent');
    expect(alertsLink).toHaveClass('bg-urgent/5');
  });
});
