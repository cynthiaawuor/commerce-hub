import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { config } from "../config/config";
import { CURRENT_USER } from "../lib/api-client";
import { kes, toCents } from "../lib/money";
import { closeRegisterDay, getRegisterDays } from "../lib/sales-audit-api";
import type { RegisterDay } from "../types/sales-audit";

type Tab = "OPEN" | "CLOSED";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-3 text-lg";

// Matches the service's rule, so the manager is told before they press Close
const MIN_EXPLANATION_LENGTH = 10;

// The spec's Store Manager Dashboard: count each register at the end of the day,
// explain anything that does not match, and look back over past differences.
export function SalesAuditPage() {
  const [tab, setTab] = useState<Tab>("OPEN");

  // With the phase flag off, the app shows nothing but Coming soon
  if (!config.featureSalesAudit) {
    return <ComingSoon />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 px-4 pt-4 text-white">
        <div className="mx-auto flex max-w-3xl items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">Sales Audit</p>
            <p className="text-sm text-slate-400">Count the registers and close the day</p>
          </div>
          <p className="hidden text-right text-sm text-slate-400 sm:block">{CURRENT_USER}</p>
        </div>
        <nav className="mx-auto mt-3 flex max-w-3xl gap-1">
          <TabButton active={tab === "OPEN"} onClick={() => setTab("OPEN")}>
            To close
          </TabButton>
          <TabButton active={tab === "CLOSED"} onClick={() => setTab("CLOSED")}>
            Closed days
          </TabButton>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl p-4">
        {tab === "OPEN" ? <OpenDays /> : <ClosedDays />}
      </main>
    </div>
  );
}

function OpenDays() {
  const days = useQuery({ queryKey: ["days", "OPEN"], queryFn: () => getRegisterDays("OPEN") });
  const [selected, setSelected] = useState<RegisterDay | null>(null);
  const [lastClosed, setLastClosed] = useState<RegisterDay | null>(null);

  if (selected) {
    return (
      <CloseForm
        day={selected}
        onBack={() => setSelected(null)}
        onClosed={(day) => {
          setLastClosed(day);
          setSelected(null);
        }}
      />
    );
  }

  return (
    <>
      {lastClosed && (
        <div
          role="status"
          className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          <span>
            {lastClosed.registerCode} on {lastClosed.businessDate} closed,{" "}
            {describe(lastClosed.differenceCents ?? 0)}
          </span>
          <button type="button" onClick={() => setLastClosed(null)} className="font-medium">
            OK
          </button>
        </div>
      )}

      {days.isPending ? (
        <LoadingState label="Loading registers…" />
      ) : days.isError ? (
        <ErrorState
          message={days.error.message}
          action={
            <Button variant="secondary" onClick={() => days.refetch()}>
              Try again
            </Button>
          }
        />
      ) : days.data.length === 0 ? (
        <EmptyState
          title="Nothing to close"
          message="A register appears here once it has made a sale."
        />
      ) : (
        <ul className="space-y-3">
          {days.data.map((day) => (
            <li key={day.id}>
              <button
                type="button"
                onClick={() => setSelected(day)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-slate-400"
              >
                <div>
                  <p className="font-semibold">
                    {day.registerCode} · {day.businessDate}
                  </p>
                  <p className="text-sm text-slate-500">
                    {day.salesCount} sale(s) · cash {kes(day.expectedCashCents)} · card{" "}
                    {kes(day.expectedCardCents)}
                  </p>
                </div>
                <p className="text-lg font-semibold">{kes(day.expectedTotalCents)}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function CloseForm({
  day,
  onBack,
  onClosed,
}: {
  day: RegisterDay;
  onBack: () => void;
  onClosed: (day: RegisterDay) => void;
}) {
  const queryClient = useQueryClient();
  const [cash, setCash] = useState("");
  const [card, setCard] = useState("");
  const [explanation, setExplanation] = useState("");

  const close = useMutation({
    mutationFn: closeRegisterDay,
    onSuccess: (closed) => {
      queryClient.invalidateQueries({ queryKey: ["days"] });
      onClosed(closed);
    },
  });

  const cashCents = toCents(cash);
  const cardCents = card.trim() ? toCents(card) : 0;
  const counted = cashCents !== null && cardCents !== null;

  const cashDifference = counted ? cashCents - day.expectedCashCents : 0;
  const cardDifference = counted ? cardCents - day.expectedCardCents : 0;
  const balanced = counted && cashDifference === 0 && cardDifference === 0;
  const needsReason = counted && !balanced;
  const reasonGiven = explanation.trim().length >= MIN_EXPLANATION_LENGTH;

  const submit = () => {
    if (!counted) return;
    close.mutate({
      id: day.id,
      countedCashCents: cashCents,
      countedCardCents: cardCents,
      explanation,
    });
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {day.registerCode} · {day.businessDate}
          </h1>
          <p className="text-sm text-slate-500">
            {day.storeCode} · {day.salesCount} sale(s)
          </p>
        </div>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CountBox
          label="Cash in the drawer (KES)"
          expectedCents={day.expectedCashCents}
          value={cash}
          onChange={setCash}
          differenceCents={counted && cash.trim() ? cashDifference : null}
        />
        <CountBox
          label="Card slips (KES)"
          expectedCents={day.expectedCardCents}
          value={card}
          onChange={setCard}
          differenceCents={counted && cash.trim() ? cardDifference : null}
        />
      </div>

      {counted && cash.trim() && (
        <p
          className={`mt-4 rounded-md p-3 text-center text-lg font-semibold ${
            balanced ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-900"
          }`}
        >
          {balanced ? "Balanced" : `Overall ${describe(cashDifference + cardDifference)}`}
        </p>
      )}

      {cash.trim() && !counted && (
        <p className="mt-3 text-sm text-red-700">Amounts look like 5000 or 4950.50</p>
      )}

      <label className="mt-4 block text-sm">
        <span className="mb-1 block text-slate-600">
          What happened? {needsReason ? "(required, as the count does not match)" : "(optional)"}
        </span>
        <textarea
          value={explanation}
          onChange={(event) => setExplanation(event.target.value)}
          rows={3}
          maxLength={1000}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>

      {close.isError && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {close.error.message}
        </p>
      )}

      <Button
        onClick={submit}
        disabled={!cash.trim() || !counted || (needsReason && !reasonGiven) || close.isPending}
        className="mt-4 w-full py-3 text-base"
      >
        {close.isPending ? "Closing…" : "Sign off and close the day"}
      </Button>
    </section>
  );
}

function CountBox({
  label,
  expectedCents,
  value,
  onChange,
  differenceCents,
}: {
  label: string;
  expectedCents: number;
  value: string;
  onChange: (value: string) => void;
  differenceCents: number | null;
}) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">{label}</span>
        <input
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      </label>
      <p className="mt-2 text-sm text-slate-500">Expected {kes(expectedCents)}</p>
      {differenceCents !== null && <DifferenceBadge cents={differenceCents} />}
    </div>
  );
}

function ClosedDays() {
  const days = useQuery({ queryKey: ["days", "CLOSED"], queryFn: () => getRegisterDays("CLOSED") });

  if (days.isPending) {
    return <LoadingState label="Loading closed days…" />;
  }

  if (days.isError) {
    return (
      <ErrorState
        message={days.error.message}
        action={
          <Button variant="secondary" onClick={() => days.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  if (days.data.length === 0) {
    return <EmptyState title="No closed days yet" />;
  }

  return (
    <ul className="space-y-3">
      {days.data.map((day) => (
        <li key={day.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">
                {day.registerCode} · {day.businessDate}
              </p>
              <p className="text-sm text-slate-500">
                Expected {kes(day.expectedTotalCents)} · counted{" "}
                {kes((day.countedCashCents ?? 0) + (day.countedCardCents ?? 0))}
              </p>
            </div>
            <DifferenceBadge cents={day.differenceCents ?? 0} />
          </div>

          {day.explanation && (
            <p className="mt-2 rounded-md bg-slate-50 p-2 text-sm italic text-slate-700">
              “{day.explanation}”
            </p>
          )}

          <p className="mt-2 text-xs text-slate-500">
            Signed off by {day.closedBy}
            {day.closedAt && ` · ${new Date(day.closedAt).toLocaleString()}`}
          </p>

          {day.checkedWithPos === false && (
            <p className="mt-2 text-xs text-amber-800">
              Point of Sale was unavailable at close, so the figures were not cross-checked.
            </p>
          )}
          {day.salesAfterClose > 0 && (
            <p className="mt-1 text-xs font-medium text-red-700">
              {day.salesAfterClose} sale(s) arrived after this day was closed. Check the count again.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

const describe = (cents: number) =>
  cents === 0 ? "balanced" : `${kes(Math.abs(cents))} ${cents < 0 ? "short" : "over"}`;

function DifferenceBadge({ cents }: { cents: number }) {
  const style =
    cents === 0
      ? "bg-green-100 text-green-800"
      : cents < 0
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-800";

  return (
    <span className={`mt-2 inline-block shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {cents === 0 ? "Balanced" : describe(cents)}
    </span>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-t-md px-4 py-2.5 text-sm font-medium ${
        active ? "bg-slate-50 text-slate-900" : "text-slate-300 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function ComingSoon() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
        <h1 className="text-xl font-semibold">Coming soon</h1>
        <p className="mt-2 text-sm text-slate-500">Sales Audit is not enabled here.</p>
      </div>
    </div>
  );
}
