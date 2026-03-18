import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReports } from '../../hooks/useReports';
import { useAuth } from '../../hooks/useAuth';
import DispatchForm from './DispatchForm';
import LoadingSpinner from '../Common/LoadingSpinner';

function formatTimestamp(seconds) {
  if (!seconds) return '';
  return new Date(seconds * 1000).toLocaleString();
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reports, verifyReport, rejectReport } = useReports();
  const { userProfile, user } = useAuth();

  const [responseAction, setResponseAction] = useState(null);
  const [assignedUnit, setAssignedUnit] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photoIndex, _setPhotoIndex] = useState(0);

  const report = reports.find((r) => r.id === id);

  if (!report) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  const { disaster = {}, location = {}, timestamp, media = {}, reporter = {} } = report;
  const photos = media.photos ?? [];

  async function handleDispatch() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await verifyReport(id, {
        verifiedBy: user.uid,
        verifierRole: userProfile?.role,
        responseAction,
        assignedUnit,
        notes,
      });
      navigate('/admin');
    } catch (err) {
      console.error('Dispatch failed:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    const reason = window.prompt('Rejection reason (required):');
    if (!reason?.trim()) return;
    await rejectReport(id, { rejectedBy: user.uid, reason });
    navigate('/admin');
  }

  return (
    <div className="h-full overflow-y-auto bg-app-bg">
      {/* Photos */}
      {photos.length > 0 && (
        <div className="relative bg-black">
          <img
            src={photos[photoIndex]}
            alt={`Report photo ${photoIndex + 1}`}
            className="w-full object-cover"
            style={{ maxHeight: 220 }}
          />
          {photos.length > 1 && (
            <div className="absolute bottom-2 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
              {photoIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      )}

      {/* Report metadata */}
      <div className="bg-surface px-4 py-4 shadow-card mb-2">
        <h1 className="text-base font-bold text-text-primary">{disaster.type}</h1>
        <p className="text-xs text-text-tertiary mt-0.5">
          {[location.barangay, location.municipality].filter(Boolean).join(', ')}
        </p>
        <p className="text-xs text-text-tertiary mt-0.5">
          {formatTimestamp(timestamp?.seconds)} · {reporter.name ?? 'Anonymous'}
        </p>
        {disaster.description && (
          <p className="text-sm text-text-secondary mt-3 leading-relaxed">{disaster.description}</p>
        )}
      </div>

      {/* Dispatch form */}
      <div className="bg-surface shadow-card">
        <DispatchForm
          responseAction={responseAction}
          assignedUnit={assignedUnit}
          notes={notes}
          onResponseActionChange={setResponseAction}
          onAssignedUnitChange={setAssignedUnit}
          onNotesChange={setNotes}
          onSubmit={handleDispatch}
          onReject={handleReject}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
