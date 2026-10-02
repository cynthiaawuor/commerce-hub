import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { ErrorState, LoadingState } from "./States";

// A titled card. `aside` sits opposite the title: a badge, a total or a control.
export function Panel({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

// One headline number with its label. Values keep the font's normal figures: equal-width
// digits are for columns that must line up, and look loose at this size.
export function Figure({
  label,
  value,
  note,
  lead = false,
}: {
  label: string;
  value: string;
  note?: string;
  // The one figure the page leads with
  lead?: boolean;
}) {
  return (
    <div className="h-full rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`mt-1 font-semibold ${lead ? "text-5xl" : "text-2xl"}`}>{value}</p>
      {note && <p className="mt-1 text-sm text-slate-500">{note}</p>}
    </div>
  );
}

type Tone = "good" | "warning" | "bad" | "neutral";

const tones: Record<Tone, string> = {
  good: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-900",
  bad: "bg-red-100 text-red-800",
  neutral: "bg-slate-100 text-slate-700",
};

// Always carries words, so a state is never told by colour alone
export function Badge({ tone, children }: { tone: Tone; children: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

// Loading and failure look the same on every tab, so they are handled once here
export function Loaded<T>({
  query,
  children,
}: {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) {
    return <LoadingState />;
  }

  if (query.isError) {
    return (
      <div className="p-4">
        <ErrorState
          message={query.error.message}
          action={
            <Button variant="secondary" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children(query.data)}</>;
}

// Table cells. Amounts are right-aligned with equal-width digits so columns line up.
export const th = "px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500";
export const thRight = `${th} text-right`;
export const td = "px-4 py-2.5";
export const tdRight = `${td} whitespace-nowrap text-right tabular-nums`;

export function EmptyRow({ columns, children }: { columns: number; children: string }) {
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-8 text-center text-sm text-slate-500">
        {children}
      </td>
    </tr>
  );
}
