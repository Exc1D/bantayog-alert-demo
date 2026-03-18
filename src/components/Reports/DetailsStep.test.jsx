import { render, screen, fireEvent } from '@testing-library/react';
import DetailsStep from './DetailsStep';

describe('DetailsStep', () => {
  const defaultProps = {
    description: '',
    severity: null,
    municipality: 'Daet',
    onDescriptionChange: vi.fn(),
    onSeverityChange: vi.fn(),
    onSubmit: vi.fn(),
    submitting: false,
  };

  it('renders severity chips', () => {
    render(<DetailsStep {...defaultProps} />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('Minor')).toBeInTheDocument();
  });

  it('disables submit when description is too short', () => {
    render(<DetailsStep {...defaultProps} description="Hi" severity="critical" />);
    const btn = screen.getByRole('button', { name: /submit/i });
    expect(btn).toBeDisabled();
  });

  it('disables submit when no severity selected', () => {
    render(
      <DetailsStep {...defaultProps} description="Long enough description text" severity={null} />
    );
    const btn = screen.getByRole('button', { name: /submit/i });
    expect(btn).toBeDisabled();
  });

  it('enables submit when description is long enough and severity is set', () => {
    render(
      <DetailsStep
        {...defaultProps}
        description="Long enough description text"
        severity="critical"
      />
    );
    const btn = screen.getByRole('button', { name: /submit/i });
    expect(btn).not.toBeDisabled();
  });

  it('calls onSeverityChange when a chip is clicked', () => {
    const onSeverityChange = vi.fn();
    render(<DetailsStep {...defaultProps} onSeverityChange={onSeverityChange} />);
    fireEvent.click(screen.getByText('Critical'));
    expect(onSeverityChange).toHaveBeenCalledWith('critical');
  });
});
