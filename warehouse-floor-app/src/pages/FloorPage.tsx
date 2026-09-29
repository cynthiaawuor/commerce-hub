import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { config } from "../config/config";
import { completeTask, getPendingTasks, getShelfLocations } from "../lib/warehouse-api";
import type { PutawayTask, ShelfLocation } from "../types/warehouse";

type Tab = "tasks" | "shelves";

// One screen for the warehouse floor: what is waiting at the dock and where it should
// go, plus what is on every shelf.
export function FloorPage() {
  const [tab, setTab] = useState<Tab>("tasks");

  // With the phase flag off, the app shows nothing but Coming soon
  if (!config.featureWarehouse) {
    return <ComingSoon />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 px-4 pt-4 text-white">
        <p className="text-lg font-semibold">Warehouse floor</p>
        <p className="text-sm text-slate-400">Put received goods away</p>
        <nav className="mt-3 flex gap-1">
          <TabButton active={tab === "tasks"} onClick={() => setTab("tasks")}>
            To put away
          </TabButton>
          <TabButton active={tab === "shelves"} onClick={() => setTab("shelves")}>
            Shelves
          </TabButton>
        </nav>
      </header>

      <main className="mx-auto max-w-2xl p-4">
        {tab === "tasks" ? <TasksView /> : <ShelvesView />}
      </main>
    </div>
  );
}

function TasksView() {
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: getPendingTasks });
  const [selected, setSelected] = useState<PutawayTask | null>(null);
  const [lastDone, setLastDone] = useState<PutawayTask | null>(null);

  if (selected) {
    return (
      <PutAwayForm
        task={selected}
        onBack={() => setSelected(null)}
        onDone={(task) => {
          setLastDone(task);
          setSelected(null);
        }}
      />
    );
  }

  return (
    <>
      {lastDone && (
        <div
          role="status"
          className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          <span>
            {lastDone.quantity} × {lastDone.productName} put on{" "}
            <span className="font-semibold">{lastDone.shelfCode}</span>
          </span>
          <button type="button" onClick={() => setLastDone(null)} className="font-medium">
            OK
          </button>
        </div>
      )}

      {tasks.isPending ? (
        <LoadingState label="Loading tasks…" />
      ) : tasks.isError ? (
        <ErrorState
          message={tasks.error.message}
          action={
            <Button variant="secondary" onClick={() => tasks.refetch()}>
              Try again
            </Button>
          }
        />
      ) : tasks.data.length === 0 ? (
        <EmptyState
          title="Nothing to put away"
          message="Tasks appear here once goods are received at the dock."
        />
      ) : (
        <ul className="space-y-3">
          {tasks.data.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => setSelected(task)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-slate-400"
              >
                <div>
                  <p className="font-semibold">
                    {task.quantity} × {task.productName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {task.goodsReceivedNoteNumber} · {task.purchaseOrderNumber}
                  </p>
                </div>
                <ShelfBadge code={task.suggestedShelfCode} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function PutAwayForm({
  task,
  onBack,
  onDone,
}: {
  task: PutawayTask;
  onBack: () => void;
  onDone: (task: PutawayTask) => void;
}) {
  const queryClient = useQueryClient();
  const shelves = useQuery({ queryKey: ["shelves"], queryFn: getShelfLocations });
  // Start on the suggestion: the worker only changes it when the shelf is not usable
  const [shelfCode, setShelfCode] = useState(task.suggestedShelfCode ?? "");

  const confirm = useMutation({
    mutationFn: completeTask,
    onSuccess: (completed) => {
      // The task list and shelf space both just changed
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["shelves"] });
      onDone(completed);
    },
  });

  // Only shelves with room for everything, since goods are not split across shelves
  const options = (shelves.data ?? []).filter(
    (shelf) => shelf.freeUnits >= task.quantity || shelf.code === shelfCode,
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {task.quantity} × {task.productName}
          </h1>
          <p className="text-sm text-slate-500">
            {task.goodsReceivedNoteNumber} · {task.purchaseOrderNumber}
          </p>
        </div>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>

      <div className="mb-4 rounded-lg bg-slate-100 p-4 text-center">
        <p className="text-sm text-slate-600">
          {task.suggestedShelfCode ? "Put it on shelf" : "No shelf had room. Choose one below."}
        </p>
        {task.suggestedShelfCode && (
          <p className="text-4xl font-bold tracking-wide">{task.suggestedShelfCode}</p>
        )}
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">Shelf used</span>
        <select
          value={shelfCode}
          onChange={(event) => setShelfCode(event.target.value)}
          disabled={shelves.isPending}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-lg"
        >
          <option value="" disabled>
            {shelves.isPending ? "Loading shelves…" : "Choose a shelf"}
          </option>
          {options.map((shelf) => (
            <option key={shelf.id} value={shelf.code}>
              {shelf.code} · zone {shelf.zone} · room for {shelf.freeUnits}
            </option>
          ))}
        </select>
      </label>

      {confirm.isError && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {confirm.error.message}
        </p>
      )}

      <Button
        onClick={() => confirm.mutate({ id: task.id, shelfCode })}
        disabled={!shelfCode || confirm.isPending}
        className="mt-4 w-full py-3 text-base"
      >
        {confirm.isPending ? "Saving…" : "Done, it's on the shelf"}
      </Button>
    </section>
  );
}

function ShelvesView() {
  const shelves = useQuery({ queryKey: ["shelves"], queryFn: getShelfLocations });

  if (shelves.isPending) {
    return <LoadingState label="Loading shelves…" />;
  }

  if (shelves.isError) {
    return (
      <ErrorState
        message={shelves.error.message}
        action={
          <Button variant="secondary" onClick={() => shelves.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  if (shelves.data.length === 0) {
    return (
      <EmptyState
        title="No shelves yet"
        message="A supervisor adds shelves once they are labelled on the racks."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {shelves.data.map((shelf) => (
        <ShelfCard key={shelf.id} shelf={shelf} />
      ))}
    </ul>
  );
}

function ShelfCard({ shelf }: { shelf: ShelfLocation }) {
  const percentFull = Math.round((shelf.occupiedUnits / shelf.capacityUnits) * 100);
  const barColour =
    percentFull >= 90 ? "bg-red-500" : percentFull >= 60 ? "bg-amber-500" : "bg-green-500";

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-lg font-semibold">{shelf.code}</p>
        <p className="text-sm text-slate-500">
          Zone {shelf.zone} · {shelf.distanceFromDock} m from the dock
        </p>
      </div>

      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={percentFull}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${shelf.code} is ${percentFull}% full`}
      >
        <div className={`h-full ${barColour}`} style={{ width: `${percentFull}%` }} />
      </div>
      <p className="mt-1 text-sm text-slate-600">
        {shelf.occupiedUnits} of {shelf.capacityUnits} used · room for {shelf.freeUnits}
      </p>

      {shelf.products.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-100 border-t border-slate-100 text-sm">
          {shelf.products.map((product) => (
            <li key={product.id} className="flex justify-between py-1.5">
              <span>{product.productName}</span>
              <span className="font-medium">{product.quantity}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function ShelfBadge({ code }: { code: string | null }) {
  return code ? (
    <span className="rounded-md bg-slate-900 px-3 py-1.5 text-lg font-bold text-white">
      {code}
    </span>
  ) : (
    <span className="rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800">
      Choose shelf
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
        <p className="mt-2 text-sm text-slate-500">Warehouse operations are not enabled here.</p>
      </div>
    </div>
  );
}
