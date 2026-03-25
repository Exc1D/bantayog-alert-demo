import { useState } from 'react';
import Button from '../Common/Button';
import ConfirmDialog from '../Common/ConfirmDialog';

export default function BulkActionsToolbar({
  selectedIds,
  onToggleAll,
  onBulkVerify,
  onBulkResolve,
  onCsvExport,
  allSelected,
  activeTab,
  reports,
}) {
  const [confirming, setConfirming] = useState(null); // 'verify' | 'resolve' | null

  const bulkVerifyDisabled = activeTab !== 'pending' || selectedIds.length === 0;
  const bulkResolveDisabled = activeTab !== 'verified' || selectedIds.length === 0;
  const csvDisabled = reports.length === 0;

  const handleConfirm = async () => {
    if (confirming === 'verify') {
      await onBulkVerify();
    } else if (confirming === 'resolve') {
      await onBulkResolve();
    }
    setConfirming(null);
  };

  return (
    <>
      <div className="flex items-center gap-2 bg-white dark:bg-dark-elevated border border-border/60 dark:border-dark-border rounded-xl p-3 mb-3">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAll}
          className="rounded border-stone-300"
          aria-label="Select all"
        />
        <span className="text-xs text-textLight dark:text-dark-textLight mr-2">
          {selectedIds.length} selected
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={bulkVerifyDisabled}
          onClick={() => setConfirming('verify')}
          title={bulkVerifyDisabled ? 'Select pending reports first' : ''}
        >
          Bulk Verify
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={bulkResolveDisabled}
          onClick={() => setConfirming('resolve')}
          title={bulkResolveDisabled ? 'Select verified reports first' : ''}
        >
          Bulk Resolve
        </Button>
        <Button size="sm" variant="secondary" disabled={csvDisabled} onClick={onCsvExport}>
          CSV ↓
        </Button>
      </div>

      <ConfirmDialog
        isOpen={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={handleConfirm}
        title={confirming === 'verify' ? 'Bulk Verify' : 'Bulk Resolve'}
        message={`You are about to ${confirming} ${selectedIds.length} report(s). This action cannot be undone.`}
        confirmLabel={confirming === 'verify' ? 'Verify All' : 'Resolve All'}
        confirmClass="bg-accent hover:bg-accent/90"
      />
    </>
  );
}
