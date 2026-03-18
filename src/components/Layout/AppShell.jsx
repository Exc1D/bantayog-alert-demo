import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import Header from './Header';
import TabNavigation from './TabNavigation';
import LoadingSpinner from '../Common/LoadingSpinner';

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner />
    </div>
  );
}

export default function AppShell() {
  return (
    <div className="flex flex-col h-dvh bg-app-bg overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden relative">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      {/* TODO Phase 2+: Replace with sidebar on lg+ breakpoint for desktop layout */}
      <TabNavigation />
    </div>
  );
}
