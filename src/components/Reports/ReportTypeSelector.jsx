export default function ReportTypeSelector({ onSelect }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-textLight text-center">
        What are you reporting?
      </p>
      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={() => onSelect('emergency')}
          className="flex items-center gap-4 p-4 rounded-xl border-2 border-red-200 bg-red-50 hover:border-red-400 hover:bg-red-100 transition-all active:scale-[0.98]"
        >
          <span className="text-3xl">⚠️</span>
          <div className="text-left">
            <p className="font-bold text-red-800 text-base">Emergency</p>
            <p className="text-xs text-red-600 mt-0.5">
              Immediate danger to life or property. Requires urgent response.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('situation')}
          className="flex items-center gap-4 p-4 rounded-xl border-2 border-amber-200 bg-amber-50 hover:border-amber-400 hover:bg-amber-100 transition-all active:scale-[0.98]"
        >
          <span className="text-3xl">ℹ</span>
          <div className="text-left">
            <p className="font-bold text-amber-800 text-base">Situation</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Something that needs attention but is not immediately life-threatening.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
