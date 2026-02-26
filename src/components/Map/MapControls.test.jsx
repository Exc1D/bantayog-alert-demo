import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MapControls from './MapControls';

vi.mock('../../utils/constants', () => ({
  MUNICIPALITIES: ['Daet', 'Mercedes', 'Vinzons', 'Labo'],
}));

describe('MapControls', () => {
  const defaultFilters = {
    municipality: 'all',
  };

  it('renders municipality select', () => {
    const onFilterChange = vi.fn();
    render(
      <MapControls filters={defaultFilters} onFilterChange={onFilterChange} reportCount={5} />
    );

    expect(screen.getByLabelText(/filter by municipality/i)).toBeInTheDocument();
  });

  it('renders All Areas option', () => {
    const onFilterChange = vi.fn();
    render(
      <MapControls filters={defaultFilters} onFilterChange={onFilterChange} reportCount={5} />
    );

    expect(screen.getByText('All Areas')).toBeInTheDocument();
  });

  it('renders all municipalities', () => {
    const onFilterChange = vi.fn();
    render(
      <MapControls filters={defaultFilters} onFilterChange={onFilterChange} reportCount={5} />
    );

    expect(screen.getByText('Daet')).toBeInTheDocument();
    expect(screen.getByText('Mercedes')).toBeInTheDocument();
    expect(screen.getByText('Vinzons')).toBeInTheDocument();
    expect(screen.getByText('Labo')).toBeInTheDocument();
  });

  it('displays report count', () => {
    const onFilterChange = vi.fn();
    render(
      <MapControls filters={defaultFilters} onFilterChange={onFilterChange} reportCount={42} />
    );

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('calls onFilterChange when municipality changes', () => {
    const onFilterChange = vi.fn();
    render(
      <MapControls filters={defaultFilters} onFilterChange={onFilterChange} reportCount={5} />
    );

    const select = screen.getByLabelText(/filter by municipality/i);
    fireEvent.change(select, { target: { value: 'Daet' } });

    expect(onFilterChange).toHaveBeenCalledWith({
      municipality: 'Daet',
    });
  });

  it('applies custom municipality value', () => {
    const onFilterChange = vi.fn();
    render(
      <MapControls
        filters={{ municipality: 'Mercedes' }}
        onFilterChange={onFilterChange}
        reportCount={5}
      />
    );

    const select = screen.getByLabelText(/filter by municipality/i);
    expect(select.value).toBe('Mercedes');
  });

  it('has proper styling classes', () => {
    const onFilterChange = vi.fn();
    const { container } = render(
      <MapControls filters={defaultFilters} onFilterChange={onFilterChange} reportCount={5} />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('absolute');
    expect(wrapper).toHaveClass('top-3');
    expect(wrapper).toHaveClass('left-3');
    expect(wrapper).toHaveClass('z-[1000]');
  });
});
