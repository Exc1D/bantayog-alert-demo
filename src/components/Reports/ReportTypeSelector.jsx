export default function ReportTypeSelector({ onSelect }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-textLight text-center">What are you reporting?</p>
      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={() => onSelect('emergency')}
          className="flex items-center gap-4 p-5 rounded-xl border-2 border-accent/30 bg-accentSoft hover:border-accent/60 hover:bg-red-100 transition-all active:scale-[0.98]"
        >
          <span className="text-3xl">⚠️</span>
          <div className="text-left">
            <p className="font-display text-accent text-base">Emergency</p>
            <p className="text-xs text-accentDark mt-0.5">
              Immediate danger to life or property. Requires urgent response.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('situation')}
          className="flex items-center gap-4 p-5 rounded-xl border-2 border-warning/30 bg-yellow-50 hover:border-warning/60 hover:bg-yellow-100 transition-all active:scale-[0.98]"
        >
          <span className="text-3xl">ℹ</span>
          <div className="text-left">
            <p className="font-display text-warning text-base">Situation</p>
            <p className="text-xs text-orange-800 mt-0.5">
              Something that needs attention but is not immediately life-threatening.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
