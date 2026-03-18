import { useRef } from 'react';

function CameraIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export default function AvatarUpload({ name, photoUrl, onUpload, uploading }) {
  const inputRef = useRef(null);
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  }

  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      {/* Avatar circle */}
      <div
        className="w-14 h-14 rounded-full bg-gray-200 border-2 border-surface
                      flex items-center justify-center overflow-hidden"
      >
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl font-semibold text-gray-400">{initial}</span>
        )}
      </div>

      {/* Upload spinner overlay */}
      {uploading && (
        <div
          className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"
          role="status"
          aria-label="Uploading…"
        >
          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" aria-hidden="true">
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}

      {/* Camera badge */}
      {!uploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Change photo"
          className="absolute bottom-0 right-0 w-5 h-5 bg-shell rounded-full
                     border-2 border-surface flex items-center justify-center shadow-sm"
        >
          <CameraIcon />
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  );
}
