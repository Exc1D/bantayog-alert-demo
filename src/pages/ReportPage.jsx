import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitReport } from '../hooks/useReports';
import { useAuth } from '../hooks/useAuth';
import { useGeolocation } from '../hooks/useGeolocation';
import ReportTypeStep from '../components/Reports/ReportTypeStep';
import PhotoStep from '../components/Reports/PhotoStep';
import DetailsStep from '../components/Reports/DetailsStep';

const TOTAL_STEPS = 3;

export default function ReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location } = useGeolocation();
  const lat = location?.lat;
  const lng = location?.lng;

  const [step, setStep] = useState(1);
  const [disasterType, setDisasterType] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const reportData = {
        reportType: 'situation',
        disaster: {
          type: disasterType,
          severity,
          description,
          tags: [],
        },
        location: {
          lat,
          lng,
          accuracy: location?.accuracy ?? 0,
        },
      };
      const evidenceFiles = photoFile ? [photoFile] : [];
      await submitReport(reportData, evidenceFiles, user);
      navigate('/feed');
    } catch (err) {
      console.error('Report submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-app-bg">
      {/* Step header */}
      <div className="bg-shell px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
          className="text-white/60 text-sm"
          aria-label="Go back"
        >
          ←
        </button>
        <span className="text-white text-xs font-semibold flex-1 text-center">
          Step {step} of {TOTAL_STEPS}
        </span>
        {step === 2 && (
          <button
            type="button"
            onClick={() => {
              setPhotoFile(null);
              setStep(3);
            }}
            className="text-white/60 text-sm"
            aria-label="Skip photo"
          >
            Skip
          </button>
        )}
        {step !== 2 && <span className="w-8" aria-hidden="true" />}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden">
        {step === 1 && (
          <ReportTypeStep
            selected={disasterType}
            onSelect={(type) => {
              setDisasterType(type);
              setStep(2);
            }}
          />
        )}
        {step === 2 && (
          <PhotoStep photoFile={photoFile} onPhotoSelect={setPhotoFile} onNext={() => setStep(3)} />
        )}
        {step === 3 && (
          <DetailsStep
            description={description}
            severity={severity}
            municipality={null}
            onDescriptionChange={setDescription}
            onSeverityChange={setSeverity}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}
