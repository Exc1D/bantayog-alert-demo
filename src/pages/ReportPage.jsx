import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGeolocation } from '../hooks/useGeolocation';
import { resolveMunicipality } from '../utils/geoFencing';
import ReportTypeGrid from '../components/Reports/ReportTypeGrid';
import CameraCapture from '../components/Reports/CameraCapture';
import ReportConfirm from '../components/Reports/ReportConfirm';

export default function ReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location } = useGeolocation();
  const [step, setStep] = useState(1);
  const [disasterType, setDisasterType] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const municipality = location ? resolveMunicipality(location.lat, location.lng).municipality : null;

  async function handleSubmit({ description }) {
    if (submitting) return;
    setSubmitting(true);
    try {
      // TODO: Wire up submitReport — stub for now
      await new Promise((r) => setTimeout(r, 1000));
      navigate('/');
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface-dark dark:bg-surface-dark">
      {step === 1 && <ReportTypeGrid selected={disasterType} onSelect={(t) => { setDisasterType(t); setStep(2); }} />}
      {step === 2 && <CameraCapture photoFile={photoFile} onPhotoSelect={setPhotoFile} onNext={() => setStep(3)} />}
      {step === 3 && <ReportConfirm disasterType={disasterType} photoFile={photoFile} municipality={municipality} onSubmit={handleSubmit} submitting={submitting} onBack={() => setStep(2)} />}
    </div>
  );
}
