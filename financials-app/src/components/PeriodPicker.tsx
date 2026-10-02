import { thisMonth, today, type Period } from "../lib/dates";

const inputClass = "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm";

// The dates a report covers, both days included. Sits above what it filters.
export function PeriodPicker({
  period,
  onChange,
}: {
  period: Period;
  onChange: (period: Period) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="mb-1 block text-slate-600">From</span>
        <input
          type="date"
          value={period.from}
          max={period.to}
          onChange={(event) => event.target.value && onChange({ ...period, from: event.target.value })}
          className={inputClass}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-slate-600">To</span>
        <input
          type="date"
          value={period.to}
          min={period.from}
          max={today()}
          onChange={(event) => event.target.value && onChange({ ...period, to: event.target.value })}
          className={inputClass}
        />
      </label>
      <button
        type="button"
        onClick={() => onChange(thisMonth())}
        className="rounded-md px-2 py-1.5 text-sm text-slate-600 underline hover:text-slate-900"
      >
        This month
      </button>
    </div>
  );
}
