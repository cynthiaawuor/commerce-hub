import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { config } from "../config/config";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { getOpenDeliveries, submitGoodsReceivedNote } from "../lib/receiving-api";
import type { Discrepancy, ExpectedDelivery, GoodsReceivedNote } from "../types/receiving";

// What each discrepancy means to someone standing at the dock
const discrepancyLabels: Record<Discrepancy, { text: string; style: string }> = {
  NONE: { text: "As expected", style: "bg-green-100 text-green-800" },
  LESS: { text: "Short", style: "bg-amber-100 text-amber-800" },
  MORE: { text: "Extra sent", style: "bg-blue-100 text-blue-800" },
  NOT_ORDERED: { text: "Not ordered", style: "bg-red-100 text-red-800" },
};

type Count = { delivered: string; damaged: string };

// One screen for the dock: pick the delivery that just arrived, count what came off the
// truck, and get the goods received note back. Built for a tablet, so every control is
// large enough to tap with gloves on.
export function ReceivingPage() {
  const queryClient = useQueryClient();
  const deliveries = useQuery({ queryKey: ["deliveries"], queryFn: getOpenDeliveries });
  const [selected, setSelected] = useState<ExpectedDelivery | null>(null);
  const [counts, setCounts] = useState<Record<string, Count>>({});
  const [extra, setExtra] = useState({ productId: "", delivered: "" });
  const [result, setResult] = useState<GoodsReceivedNote | null>(null);

  const submit = useMutation({
    mutationFn: submitGoodsReceivedNote,
    onSuccess: (note) => {
      setResult(note);
      setSelected(null);
      setCounts({});
      setExtra({ productId: "", delivered: "" });
      // Outstanding quantities just changed, and the delivery may now be closed
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    },
  });

  const choose = (delivery: ExpectedDelivery) => {
    setResult(null);
    setSelected(delivery);
    // Start each count at what is outstanding: the clerk only changes what differs
    setCounts(
      Object.fromEntries(
        delivery.products.map((product) => [
          product.productId,
          { delivered: String(product.quantityOutstanding), damaged: "0" },
        ]),
      ),
    );
  };

  const setCount = (productId: string, field: keyof Count, value: string) =>
    setCounts({ ...counts, [productId]: { ...counts[productId]!, [field]: value } });

  const send = () => {
    if (!selected) return;

    const products = selected.products.map((product) => ({
      productId: product.productId,
      quantityDelivered: Number(counts[product.productId]?.delivered || 0),
      quantityDamaged: Number(counts[product.productId]?.damaged || 0),
    }));

    // Something on the truck that was never ordered is still recorded
    if (extra.productId.trim() && Number(extra.delivered) > 0) {
      products.push({
        productId: extra.productId.trim(),
        quantityDelivered: Number(extra.delivered),
        quantityDamaged: 0,
      });
    }

    submit.mutate({ expectedDeliveryId: selected.id, products });
  };

  // With the phase flag off, the app shows nothing but Coming soon
  if (!config.featureReceiving) {
    return <ComingSoon />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 px-4 py-4 text-white">
        <p className="text-lg font-semibold">Receiving</p>
        <p className="text-sm text-slate-400">Check deliveries in at the dock</p>
      </header>

      <main className="mx-auto max-w-2xl p-4">
        {result && <ResultCard note={result} onDone={() => setResult(null)} />}

        {selected ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold">{selected.purchaseOrderNumber}</h1>
                <p className="text-sm text-slate-500">{selected.supplierName}</p>
              </div>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Back
              </Button>
            </div>

            <p className="mb-4 text-sm text-slate-600">
              Count what came off the truck. Damaged units are recorded but not taken
              into stock.
            </p>

            {submit.isError && (
              <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {submit.error.message}
              </p>
            )}

            <ul className="space-y-3">
              {selected.products.map((product) => (
                <li key={product.productId} className="rounded-md border border-slate-200 p-3">
                  <p className="font-medium">{product.productName}</p>
                  <p className="mb-3 text-sm text-slate-500">
                    Expecting {product.quantityOutstanding}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm">
                      <span className="mb-1 block text-slate-600">Delivered</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={counts[product.productId]?.delivered ?? ""}
                        onChange={(event) =>
                          setCount(product.productId, "delivered", event.target.value)
                        }
                        className="w-full rounded-md border border-slate-300 px-3 py-3 text-lg"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block text-slate-600">Damaged</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={counts[product.productId]?.damaged ?? ""}
                        onChange={(event) =>
                          setCount(product.productId, "damaged", event.target.value)
                        }
                        className="w-full rounded-md border border-slate-300 px-3 py-3 text-lg"
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-md border border-dashed border-slate-300 p-3">
              <p className="mb-2 text-sm font-medium">Something on the truck not on the order?</p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={extra.productId}
                  onChange={(event) => setExtra({ ...extra, productId: event.target.value })}
                  placeholder="Product code"
                  className="rounded-md border border-slate-300 px-3 py-3"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={extra.delivered}
                  onChange={(event) => setExtra({ ...extra, delivered: event.target.value })}
                  placeholder="How many"
                  className="rounded-md border border-slate-300 px-3 py-3"
                />
              </div>
            </div>

            <Button onClick={send} disabled={submit.isPending} className="mt-4 w-full py-3 text-base">
              {submit.isPending ? "Recording…" : "Confirm delivery"}
            </Button>
          </section>
        ) : deliveries.isPending ? (
          <LoadingState label="Loading deliveries…" />
        ) : deliveries.isError ? (
          <ErrorState
            message={deliveries.error.message}
            action={
              <Button variant="secondary" onClick={() => deliveries.refetch()}>
                Try again
              </Button>
            }
          />
        ) : deliveries.data.length === 0 ? (
          <EmptyState
            title="Nothing expected"
            message="Deliveries appear here once a purchase order is approved."
          />
        ) : (
          <>
            <h1 className="mb-3 text-lg font-semibold">Expected deliveries</h1>
            <ul className="space-y-3">
              {deliveries.data.map((delivery) => (
                <li key={delivery.id}>
                  <button
                    type="button"
                    onClick={() => choose(delivery)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-slate-400"
                  >
                    <p className="font-semibold">{delivery.purchaseOrderNumber}</p>
                    <p className="text-sm text-slate-500">{delivery.supplierName}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {delivery.products.length} product(s),{" "}
                      {delivery.products.reduce((total, p) => total + p.quantityOutstanding, 0)}{" "}
                      units outstanding
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}

function ResultCard({ note, onDone }: { note: GoodsReceivedNote; onDone: () => void }) {
  return (
    <section className="mb-4 rounded-lg border border-green-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-green-700">Delivery recorded</p>
          <h2 className="text-xl font-semibold">{note.goodsReceivedNoteNumber}</h2>
          <p className="text-sm text-slate-500">
            {note.purchaseOrderNumber} · taken in at {note.locationCode}
          </p>
        </div>
        <Button variant="secondary" onClick={onDone}>
          Done
        </Button>
      </div>

      <ul className="divide-y divide-slate-100">
        {note.products.map((product) => {
          const label = discrepancyLabels[product.discrepancy];
          return (
            <li key={product.id} className="py-2">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{product.productName}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${label.style}`}>
                  {label.text}
                </span>
              </div>
              <p className="text-sm text-slate-600">
                Expected {product.quantityExpected} · delivered {product.quantityDelivered}
                {product.quantityDamaged > 0 && ` · ${product.quantityDamaged} damaged`} ·{" "}
                <span className="font-medium">{product.quantityAccepted} into stock</span>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ComingSoon() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
        <h1 className="text-xl font-semibold">Coming soon</h1>
        <p className="mt-2 text-sm text-slate-500">Receiving is not enabled here.</p>
      </div>
    </div>
  );
}

