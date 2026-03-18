import { render, screen } from '@testing-library/react';
import SuspensionCard from './SuspensionCard';

const activeSuspension = {
  active: true,
  type: 'Class Suspension',
  issuedBy: 'DepEd · Camarines Norte',
  scope: 'All levels',
  issuedAt: { seconds: Math.floor(Date.now() / 1000) - 3600 },
};

const inactiveSuspension = { ...activeSuspension, active: false };

describe('SuspensionCard', () => {
  it('renders nothing when no suspensions', () => {
    const { container } = render(<SuspensionCard suspensions={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when all suspensions are inactive', () => {
    const { container } = render(<SuspensionCard suspensions={[inactiveSuspension]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders active suspension', () => {
    render(<SuspensionCard suspensions={[activeSuspension]} />);
    expect(screen.getByText('Class Suspension')).toBeInTheDocument();
    expect(screen.getByText(/DepEd/i)).toBeInTheDocument();
    expect(screen.getByText(/All levels/i)).toBeInTheDocument();
  });

  it('renders multiple active suspensions as separate cards', () => {
    const second = {
      ...activeSuspension,
      type: 'Work Suspension',
      issuedBy: 'DILG · Camarines Norte',
    };
    render(<SuspensionCard suspensions={[activeSuspension, second]} />);
    expect(screen.getByText('Class Suspension')).toBeInTheDocument();
    expect(screen.getByText('Work Suspension')).toBeInTheDocument();
  });
});
