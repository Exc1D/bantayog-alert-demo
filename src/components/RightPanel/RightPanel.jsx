/**
 * RightPanel — placeholder shell for the desktop right panel.
 * Task 5 (FeedPanel), Task 6 (AlertsPanel), Task 7 (DataPanel),
 * and Task 8 (IncidentDetail) will fill this in.
 */
export default function RightPanel() {
  return (
    <aside className="hidden lg:flex flex-col bg-white dark:bg-dark-card border-l border-border/60 dark:border-dark-border h-[calc(100vh-60px)] fixed top-[60px] right-0 w-80 shrink-0 overflow-y-auto">
      <div className="flex items-center justify-center h-full text-textMuted dark:text-dark-textMuted text-sm">
        RightPanel — coming in Tasks 5–8
      </div>
    </aside>
  );
}
