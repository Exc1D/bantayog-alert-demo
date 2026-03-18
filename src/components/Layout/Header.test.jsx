import { render, screen } from '@testing-library/react';
import Header from './Header';

describe('Header', () => {
  it('renders app name', () => {
    render(<Header />);
    expect(screen.getByText('BANTAYOG ALERT')).toBeInTheDocument();
  });
});
