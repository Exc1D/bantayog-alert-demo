import { Outlet } from 'react-router-dom';
import Header from './Header';
import TabNavigation from './TabNavigation';

export default function AppShell() {
  return (
    <div className="flex flex-col h-dvh bg-app-bg overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>
      {/* TODO Phase 2+: Replace with sidebar on lg+ breakpoint for desktop layout */}
      <TabNavigation />
    </div>
  );
}
