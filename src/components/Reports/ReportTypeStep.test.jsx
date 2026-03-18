import { render, screen, fireEvent } from '@testing-library/react';
import ReportTypeStep from './ReportTypeStep';

const TYPES = ['Flood', 'Landslide', 'Fire', 'Earthquake'];

describe('ReportTypeStep', () => {
  it('renders all disaster types', () => {
    render(<ReportTypeStep types={TYPES} selected={null} onSelect={vi.fn()} />);
    TYPES.forEach((t) => expect(screen.getByText(t)).toBeInTheDocument());
  });

  it('calls onSelect when a type is tapped', () => {
    const onSelect = vi.fn();
    render(<ReportTypeStep types={TYPES} selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Flood'));
    expect(onSelect).toHaveBeenCalledWith('Flood');
  });

  it('highlights selected type', () => {
    render(<ReportTypeStep types={TYPES} selected="Flood" onSelect={vi.fn()} />);
    const floodBtn = screen.getByText('Flood').closest('button');
    expect(floodBtn).toHaveClass('border-urgent');
  });
});
