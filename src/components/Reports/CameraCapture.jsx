import { useEffect, useRef, useState } from 'react';
import { Camera, Images, ArrowRight } from '@phosphor-icons/react';

export default function CameraCapture({ photoFile, onPhotoSelect, onNext }) {
  const [preview, setPreview] = useState(photoFile ? URL.createObjectURL(photoFile) : null);
  const inputRef = useRef(null);

  // Create preview URL when photoFile changes, revoke on cleanup
  useEffect(() => {
    if (!photoFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  function handleCapture(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onPhotoSelect(file);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative bg-dark-bg dark:bg-dark-bg flex flex-col items-center justify-center p-4">
        <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Capture photo" />
        {!preview ? (
          <div className="flex flex-col items-center gap-4 text-muted-dark dark:text-muted-dark">
            <Camera size={64} aria-hidden="true" />
            <p className="text-sm">Tap to take a photo</p>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <img src={preview} alt="Captured evidence" className="w-full h-full object-contain rounded-lg" />
            <button type="button" onClick={() => { setPreview(null); onPhotoSelect(null); }} className="absolute top-2 right-2 w-8 h-8 bg-[#1C1C1E] text-white rounded-full flex items-center justify-center text-sm" aria-label="Remove photo">×</button>
          </div>
        )}
      </div>
      <div className="p-4 flex gap-3">
        <button type="button" onClick={() => inputRef.current?.click()} className="flex-1 py-3 rounded-xl border border-dark-border text-dark-text dark:text-dark-text flex items-center justify-center gap-2 text-sm">
          <Images size={18} aria-hidden="true" />
          Gallery
        </button>
        <button type="button" onClick={onNext} disabled={!photoFile} className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${photoFile ? 'bg-emergency dark:bg-emergency-dark text-white active:scale-95' : 'bg-surface-dark/50 dark:bg-surface-dark/50 text-muted-dark dark:text-muted-dark cursor-not-allowed'}`}>
          Next <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
