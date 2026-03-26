import { useEffect, useRef, useCallback } from 'react';

/**
 * Reusable bottom sheet drawer component.
 *
 * Props:
 *   isOpen    — boolean, controls open/close
 *   onClose   — called when user dismisses (via backdrop, Escape, or drag)
 *   children  — content to render inside the sheet
 *   title     — optional header title
 */
export default function BottomSheet({ isOpen, onClose, children, title }) {
  const sheetRef = useRef(null);
  const previousFocusRef = useRef(null);
  const dragStartY = useRef(0);
  const dragCurrentDelta = useRef(0);
  const isDraggingRef = useRef(false);

  // Body scroll lock + focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        sheetRef.current?.focus();
      });
    } else {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Drag-to-dismiss
  const handleDragStart = (clientY) => {
    dragStartY.current = clientY;
    dragCurrentDelta.current = 0;
    isDraggingRef.current = true;
  };

  const handleDragMove = (clientY) => {
    if (!isDraggingRef.current) return;
    const delta = clientY - dragStartY.current;
    if (delta > 0) {
      dragCurrentDelta.current = delta;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${delta}px)`;
        sheetRef.current.style.opacity = String(Math.max(0, 1 - delta / 200));
      }
    }
  };

  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const delta = dragCurrentDelta.current;
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
      sheetRef.current.style.opacity = '';
    }
    // Dismiss if dragged down more than 80px
    if (delta > 80) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-end justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'bottomsheet-title' : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        tabIndex={-1}
        className="relative w-full max-h-[85vh] bg-white dark:bg-dark-card rounded-t-2xl shadow-dark overflow-hidden flex flex-col animate-slide-up"
        onMouseDown={(e) => handleDragStart(e.clientY)}
        onMouseMove={(e) => handleDragMove(e.clientY)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
        onTouchEnd={handleDragEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-2.5 shrink-0" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-5 pb-3 shrink-0">
            <h2
              id="bottomsheet-title"
              className="text-base font-display font-semibold text-text dark:text-dark-text"
            >
              {title}
            </h2>
          </div>
        )}

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 pb-6 flex-1">{children}</div>
      </div>
    </div>
  );
}
