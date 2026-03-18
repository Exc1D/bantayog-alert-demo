import { useRef, useState, useEffect } from 'react';

export default function PhotoStep({ photoFile, onPhotoSelect, onNext }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!photoFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  return (
    <div className="h-full overflow-y-auto bg-app-bg p-4 flex flex-col gap-4">
      <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide">Add a photo</p>

      {/* Upload zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-black/20 rounded-xl overflow-hidden
                   flex items-center justify-center bg-surface"
        style={{ minHeight: 180 }}
        aria-label="Select photo"
      >
        {preview ? (
          <img
            src={preview}
            alt="Selected photo"
            className="w-full object-cover"
            style={{ maxHeight: 240 }}
          />
        ) : (
          <div className="py-10 flex flex-col items-center gap-2 text-text-tertiary">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span className="text-sm">Tap to add a photo</span>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => onPhotoSelect(e.target.files?.[0] ?? null)}
        aria-hidden="true"
      />

      {/* Next button */}
      <button
        type="button"
        onClick={onNext}
        className="bg-urgent text-white font-bold text-sm py-4 rounded-xl w-full
                   active:scale-95 transition-transform"
      >
        {photoFile ? 'Next' : 'Skip'}
      </button>
    </div>
  );
}
