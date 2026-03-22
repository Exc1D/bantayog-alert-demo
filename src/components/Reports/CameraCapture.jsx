import { useRef, useState, useEffect } from 'react';
import { Camera, Images, ArrowRight } from '@phosphor-icons/react';

export default function CameraCapture({ photoFile, onPhotoSelect, onNext }) {
  const [preview, setPreview] = useState(photoFile ? URL.createObjectURL(photoFile) : null);
  const inputRef = useRef(null);

  // Revoke object URL when preview changes or component unmounts.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function handleCapture(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onPhotoSelect(file);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative bg-surface-dark flex flex-col items-center justify-center p-4">
        <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Capture photo" />
        {!preview ? (
          <div className="flex flex-col items-center gap-4 text-text-muted-dark">
            <Camera size={64} aria-hidden="true" />
            <p className="text-sm">Tap to take a photo</p>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <img src={preview} alt="Captured" className="w-full h-full object-contain rounded-lg" />
            <button type="button" onClick={() => { setPreview(null); onPhotoSelect(null); }}
              className="absolute top-2 right-2 w-8 h-8 bg-shell text-white rounded-full flex items-center justify-center text-sm" aria-label="Remove photo">×</button>
          </div>
        )}
      </div>
      <div className="p-4 flex gap-3">
        <button type="button" onClick={() => inputRef.current?.click()}
          className="flex-1 py-3 rounded-xl border border-border-dark text-text-dark flex items-center justify-center gap-2 text-sm">
          <Images size={18} aria-hidden="true" />Gallery
        </button>
        <button type="button" onClick={onNext} disabled={!photoFile}
          className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${photoFile ? 'bg-emergency dark:bg-emergency-dark text-white active:scale-95' : 'bg-surface-dark/50 text-text-muted-dark cursor-not-allowed'}`}>
          Next<ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
