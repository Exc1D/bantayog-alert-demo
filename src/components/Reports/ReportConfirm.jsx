import { useState, useMemo, useEffect } from 'react';
import { MapPin, CheckCircle, PaperPlaneRight } from '@phosphor-icons/react';

export default function ReportConfirm({ disasterType, photoFile, municipality, onSubmit, submitting, onBack }) {
  const [description, setDescription] = useState('');

  // Memoize the object URL so it is created once per photoFile, not on every render.
  const photoUrl = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : null), [photoFile]);

  // Revoke the object URL when photoFile changes or the component unmounts.
  useEffect(() => {
    if (!photoUrl) return;
    return () => URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-surface-dark dark:bg-surface rounded-xl p-4 border border-border-dark flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emergency/10 dark:bg-emergency-dark/10 flex items-center justify-center">
              <span className="text-lg capitalize">{disasterType?.[0]}</span>
            </div>
            <div><p className="text-sm font-medium text-text-dark capitalize">{disasterType}</p><p className="text-xs text-text-muted-dark">Disaster type</p></div>
          </div>
          {photoFile && (
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-dark">
                <img src={photoUrl} alt="Evidence" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-text-muted-dark">Photo attached</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-safe" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-text-dark flex items-center gap-1">{municipality ?? 'Location detected'}{municipality && <CheckCircle size={14} className="text-safe" aria-hidden="true" />}</p>
            </div>
          </div>
          <div>
            <label htmlFor="description" className="text-xs text-text-muted-dark block mb-1">Description (optional)</label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Add any details..." rows={3}
              className="w-full p-3 bg-surface dark:bg-surface-dark border border-border-dark rounded-lg text-sm text-text-dark placeholder:text-text-muted-dark resize-none focus:outline-none focus:border-emergency" />
          </div>
        </div>
      </div>
      <div className="p-4 flex gap-3">
        <button type="button" onClick={onBack} className="py-3 px-4 rounded-xl border border-border-dark text-text-dark text-sm" disabled={submitting}>← Back</button>
        <button type="button" onClick={() => onSubmit({ description })} disabled={submitting}
          className="flex-1 py-3 bg-emergency dark:bg-emergency-dark text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50">
          {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : <><PaperPlaneRight size={18} weight="fill" aria-hidden="true" />SEND REPORT</>}
        </button>
      </div>
    </div>
  );
}
