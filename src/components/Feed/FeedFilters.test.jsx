import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FeedFilters from './FeedFilters';

vi.mock('../../utils/constants', () => ({
  MUNICIPALITIES: ['Daet', 'Mercedes', 'Vinzons', 'Labo'],
}));

describe('FeedFilters', () => {
  const defaultFilters = {
    municipality: 'all',
    sort: 'recent',
  };

  it('renders municipality and sort dropdowns', () => {
    const onFilterChange = vi.fn();
    render(<FeedFilters filters={defaultFilters} onFilterChange={onFilterChange} />);

    expect(screen.getByLabelText(/filter by municipality/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sort reports/i)).toBeInTheDocument();
  });

  it('displays all municipalities option', () => {
    const onFilterChange = vi.fn();
    render(<FeedFilters filters={defaultFilters} onFilterChange={onFilterChange} />);

    expect(screen.getByText('All Municipalities')).toBeInTheDocument();
    expect(screen.getByText('Daet')).toBeInTheDocument();
    expect(screen.getByText('Mercedes')).toBeInTheDocument();
  });

  it('displays sort options', () => {
    const onFilterChange = vi.fn();
    render(<FeedFilters filters={defaultFilters} onFilterChange={onFilterChange} />);

    expect(screen.getByText('Most Recent')).toBeInTheDocument();
    expect(screen.getByText('Most Upvoted')).toBeInTheDocument();
    expect(screen.getByText('Most Critical')).toBeInTheDocument();
  });

  it('calls onFilterChange when municipality changes', () => {
    const onFilterChange = vi.fn();
    render(<FeedFilters filters={defaultFilters} onFilterChange={onFilterChange} />);

    const municipalitySelect = screen.getByLabelText(/filter by municipality/i);
    fireEvent.change(municipalitySelect, { target: { value: 'Daet' } });

    expect(onFilterChange).toHaveBeenCalledWith({
      municipality: 'Daet',
      sort: 'recent',
    });
  });

  it('calls onFilterChange when sort changes', () => {
    const onFilterChange = vi.fn();
    render(<FeedFilters filters={defaultFilters} onFilterChange={onFilterChange} />);

    const sortSelect = screen.getByLabelText(/sort reports/i);
    fireEvent.change(sortSelect, { target: { value: 'upvoted' } });

    expect(onFilterChange).toHaveBeenCalledWith({
      municipality: 'all',
      sort: 'upvoted',
    });
  });

  it('preserves existing filters when changing one', () => {
    const onFilterChange = vi.fn();
    const filters = { municipality: 'Daet', sort: 'critical' };
    render(<FeedFilters filters={filters} onFilterChange={onFilterChange} />);

    const sortSelect = screen.getByLabelText(/sort reports/i);
    fireEvent.change(sortSelect, { target: { value: 'recent' } });

    expect(onFilterChange).toHaveBeenCalledWith({
      municipality: 'Daet',
      sort: 'recent',
    });
  });

  it('has proper select styling classes', () => {
    const onFilterChange = vi.fn();
    const { container } = render(
      <FeedFilters filters={defaultFilters} onFilterChange={onFilterChange} />
    );

    const selects = container.querySelectorAll('select');
    selects.forEach((select) => {
      expect(select.className).toContain('flex-1');
    });
  });
});
