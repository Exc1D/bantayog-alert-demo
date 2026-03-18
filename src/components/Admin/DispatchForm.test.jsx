import { render, screen, fireEvent } from '@testing-library/react';
import DispatchForm from './DispatchForm';

const defaultProps = {
  responseAction: null,
  assignedUnit: null,
  notes: '',
  onResponseActionChange: vi.fn(),
  onAssignedUnitChange: vi.fn(),
  onNotesChange: vi.fn(),
  onSubmit: vi.fn(),
  onReject: vi.fn(),
  submitting: false,
};

describe('DispatchForm', () => {
  it('renders all response action chips', () => {
    render(<DispatchForm {...defaultProps} />);
    expect(screen.getByText('Deploy team')).toBeInTheDocument();
    expect(screen.getByText('Issue advisory')).toBeInTheDocument();
    expect(screen.getByText('Monitor only')).toBeInTheDocument();
    expect(screen.getByText('Coordinate LGU')).toBeInTheDocument();
    expect(screen.getByText('Evacuate area')).toBeInTheDocument();
  });

  it('renders all unit chips', () => {
    render(<DispatchForm {...defaultProps} />);
    expect(screen.getByText('MDRRMO')).toBeInTheDocument();
    expect(screen.getByText('BFP')).toBeInTheDocument();
    expect(screen.getByText('PNP')).toBeInTheDocument();
    expect(screen.getByText('Barangay')).toBeInTheDocument();
    expect(screen.getByText('Provincial')).toBeInTheDocument();
  });

  it('Verify + Dispatch is disabled when no responseAction selected', () => {
    render(<DispatchForm {...defaultProps} assignedUnit="mdrrmo" />);
    expect(screen.getByRole('button', { name: /verify.*dispatch/i })).toBeDisabled();
  });

  it('Verify + Dispatch is disabled when no assignedUnit selected', () => {
    render(<DispatchForm {...defaultProps} responseAction="deploy-team" />);
    expect(screen.getByRole('button', { name: /verify.*dispatch/i })).toBeDisabled();
  });

  it('Verify + Dispatch is enabled when both are selected', () => {
    render(<DispatchForm {...defaultProps} responseAction="deploy-team" assignedUnit="mdrrmo" />);
    expect(screen.getByRole('button', { name: /verify.*dispatch/i })).not.toBeDisabled();
  });

  it('Verify + Dispatch remains disabled for monitor-only without assignedUnit', () => {
    render(<DispatchForm {...defaultProps} responseAction="monitor-only" assignedUnit={null} />);
    expect(screen.getByRole('button', { name: /verify.*dispatch/i })).toBeDisabled();
  });

  it('calls onResponseActionChange when chip is clicked', () => {
    const onResponseActionChange = vi.fn();
    render(<DispatchForm {...defaultProps} onResponseActionChange={onResponseActionChange} />);
    fireEvent.click(screen.getByText('Deploy team'));
    expect(onResponseActionChange).toHaveBeenCalledWith('deploy-team');
  });

  it('calls onAssignedUnitChange when unit chip is clicked', () => {
    const onAssignedUnitChange = vi.fn();
    render(<DispatchForm {...defaultProps} onAssignedUnitChange={onAssignedUnitChange} />);
    fireEvent.click(screen.getByText('MDRRMO'));
    expect(onAssignedUnitChange).toHaveBeenCalledWith('mdrrmo');
  });

  it('calls onReject when Reject button is clicked', () => {
    const onReject = vi.fn();
    render(<DispatchForm {...defaultProps} onReject={onReject} />);
    fireEvent.click(screen.getByRole('button', { name: /reject/i }));
    expect(onReject).toHaveBeenCalled();
  });
});
