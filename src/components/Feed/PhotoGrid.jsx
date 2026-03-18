const MAX_VISIBLE = 3;

export default function PhotoGrid({ photos = [], onPhotoPress }) {
  if (photos.length === 0) return null;

  const visible = photos.slice(0, MAX_VISIBLE);
  const overflow = photos.length - MAX_VISIBLE;
  const count = photos.length;

  function handleClick(index) {
    onPhotoPress?.(index);
  }

  // 1 photo — full width
  if (count === 1) {
    return (
      <button
        type="button"
        className="w-full block"
        onClick={() => handleClick(0)}
        aria-label="View photo"
      >
        <img src={photos[0]} alt="Report photo" className="w-full h-40 object-cover" />
      </button>
    );
  }

  // 2 photos — side by side
  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => handleClick(i)}
            aria-label={`View photo ${i + 1}`}
          >
            <img src={src} alt={`Report photo ${i + 1}`} className="w-full h-28 object-cover" />
          </button>
        ))}
      </div>
    );
  }

  // 3+ photos — 2+1 grid: first photo full width, then 2 side-by-side
  // with optional +N overlay on the last visible cell
  return (
    <div className="flex flex-col gap-0.5">
      {/* Top: first photo full width */}
      <button type="button" onClick={() => handleClick(0)} aria-label="View photo 1">
        <img src={visible[0]} alt="Report photo 1" className="w-full h-40 object-cover" />
      </button>
      {/* Bottom: remaining visible photos */}
      <div className="grid grid-cols-2 gap-0.5">
        {visible.slice(1).map((src, i) => {
          const idx = i + 1; // index in visible array
          const isLast = idx === visible.length - 1 && overflow > 0;
          return (
            <button
              key={src}
              type="button"
              className="relative"
              onClick={() => handleClick(idx)}
              aria-label={`View photo ${idx + 1}`}
            >
              <img src={src} alt={`Report photo ${idx + 1}`} className="w-full h-28 object-cover" />
              {isLast && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+{overflow}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
