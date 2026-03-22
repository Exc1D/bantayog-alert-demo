import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AdminNav from './AdminNav';
import LoadingSpinner from '../Common/LoadingSpinner';

const TriageQueue = lazy(() => import('./TriageQueue'));
const AdminMapView = lazy(() => import('./AdminMapView'));
const AllReports = lazy(() => import('./AllReports'));
const ReportDetail = lazy(() => import('./ReportDetail'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner />
    </div>
  );
}

export default function AdminShell() {
  return (
    <div className="flex flex-col h-full bg-app-bg">
      <AdminNav />
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route index element={<TriageQueue />} />
            <Route path="map" element={<AdminMapView />} />
            <Route path="reports" element={<AllReports />} />
            <Route path="report/:id" element={<ReportDetail />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
