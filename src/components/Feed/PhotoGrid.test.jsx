import { render, screen } from '@testing-library/react';
import PhotoGrid from './PhotoGrid';

const PHOTOS = [
  'https://example.com/1.jpg',
  'https://example.com/2.jpg',
  'https://example.com/3.jpg',
  'https://example.com/4.jpg',
];

describe('PhotoGrid', () => {
  it('renders nothing when no photos', () => {
    const { container } = render(<PhotoGrid photos={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders single photo at full width', () => {
    render(<PhotoGrid photos={[PHOTOS[0]]} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute('src', PHOTOS[0]);
  });

  it('renders 2 photos side by side', () => {
    render(<PhotoGrid photos={PHOTOS.slice(0, 2)} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(2);
  });

  it('renders 3 photos in 2+1 grid', () => {
    render(<PhotoGrid photos={PHOTOS.slice(0, 3)} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(3);
  });

  it('renders 4 photos: first 3 visible + "+N" overlay on last visible', () => {
    render(<PhotoGrid photos={PHOTOS} />);
    // Only 3 img elements rendered (the 4th is covered by the +N overlay)
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(3);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('calls onPhotoPress with index when a photo is tapped', async () => {
    const onPhotoPress = vi.fn();
    render(<PhotoGrid photos={PHOTOS.slice(0, 2)} onPhotoPress={onPhotoPress} />);
    const imgs = screen.getAllByRole('img');
    imgs[0].click();
    expect(onPhotoPress).toHaveBeenCalledWith(0);
  });
});
