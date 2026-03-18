export default function MapSkeleton() {
  return (
    <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
      <span className="text-xs text-text-tertiary">Loading map…</span>
    </div>
  );
}
