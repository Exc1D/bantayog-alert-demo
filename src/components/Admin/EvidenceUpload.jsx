import { useState } from 'react';
import { validateImage } from '../../utils/imageCompression';
import { useToast } from '../Common/Toast';
import RequirePermission from '../Common/RequirePermission';
import { PERMISSIONS } from '../../utils/rbac';

export default function EvidenceUpload({ photos, onPhotosChange, maxPhotos = 5 }) {
  const { addToast } = useToast();
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleAdd = (e) => {
    const files = Array.from(e.target.files);

    if (photos.length + files.length > maxPhotos) {
      addToast(`Maximum ${maxPhotos} evidence photos`, 'warning');
      return;
    }

    const validFiles = [];
    for (const file of files) {
      const validation = validateImage(file);
      if (!validation.valid) {
        addToast(validation.error, 'error');
        continue;
      }
      validFiles.push(file);
    }

    onPhotosChange([...photos, ...validFiles]);
    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleRemove = (index) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadContent = (
    <div>
      <label className="block text-xs font-bold text-textLight dark:text-dark-textLight uppercase tracking-wider mb-1.5">
        Evidence Photos <span className="text-accent">*</span>
      </label>
      <p className="text-[10px] text-textMuted dark:text-dark-textMuted mb-2">
        Upload 1-{maxPhotos} photos showing the issue has been resolved
      </p>

      <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-stone-300 dark:border-dark-border rounded-lg p-3 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-stone-500 dark:text-dark-textLight"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span className="text-xs text-textLight dark:text-dark-textLight font-medium">
          Upload evidence photos
        </span>
        <input type="file" accept="image/*" multiple onChange={handleAdd} className="hidden" />
      </label>

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {previewUrls.map((url, i) => (
            <div key={i} className="relative">
              <img
                src={url}
                alt={`Evidence ${i + 1}`}
                className="w-full h-16 object-cover rounded-lg border border-stone-200 dark:border-dark-border"
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <RequirePermission
      permission={PERMISSIONS.MODERATE_REPORTS}
      fallback={
        <p className="text-xs text-textMuted">You do not have permission to upload evidence.</p>
      }
    >
      {uploadContent}
    </RequirePermission>
  );
}
