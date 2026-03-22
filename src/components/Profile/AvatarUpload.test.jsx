import { render, screen } from '@testing-library/react';
import AvatarUpload from './AvatarUpload';

describe('AvatarUpload', () => {
  it('renders user initial when no photo', () => {
    render(
      <AvatarUpload name="David Aviado" photoUrl={null} onUpload={vi.fn()} uploading={false} />
    );
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('renders photo when photoUrl is provided', () => {
    render(
      <AvatarUpload
        name="David"
        photoUrl="https://example.com/avatar.jpg"
        onUpload={vi.fn()}
        uploading={false}
      />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('shows spinner overlay when uploading', () => {
    render(<AvatarUpload name="David" photoUrl={null} onUpload={vi.fn()} uploading={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('camera badge is hidden when uploading', () => {
    render(<AvatarUpload name="David" photoUrl={null} onUpload={vi.fn()} uploading={true} />);
    expect(screen.queryByLabelText('Change photo')).not.toBeInTheDocument();
  });

  it('renders camera badge when not uploading', () => {
    render(<AvatarUpload name="David" photoUrl={null} onUpload={vi.fn()} uploading={false} />);
    expect(screen.getByLabelText('Change photo')).toBeInTheDocument();
  });
});
