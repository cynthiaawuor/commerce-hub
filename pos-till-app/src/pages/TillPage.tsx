import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Button } from "../components/ui/Button";
import { config } from "../config/config";
import { CURRENT_USER } from "../lib/api-client";
import { kes, toCents, toShillings } from "../lib/money";
import {
  addProduct,
  cancelSale,
  getPrices,
  openSale,
  paySale,
  removeProduct,
} from "../lib/pos-api";
import type { PaymentMethod, Sale } from "../types/pos";

const REGISTER_KEY = "pos-till-register";

// The register is a property of the device, so it is remembered between customers.
// Storage can be blocked (private windows), so the till still works without it.
const loadRegister = () => {
  try {
    return localStorage.getItem(REGISTER_KEY) ?? "REG-1";
  } catch {
    return "REG-1";
  }
};

const saveRegister = (code: string) => {
  try {
    localStorage.setItem(REGISTER_KEY, code);
  } catch {
    // Not remembered; the cashier types it again next time
  }
};

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-3 text-lg";

// The till: start a sale, scan or tap products, take payment, hand over the receipt.
// Every product scanned is held in Inventory straight away, so it cannot be sold twice.
export function TillPage() {
  const [registerCode, setRegisterCode] = useState(loadRegister);
  const [sale, setSale] = useState<Sale | null>(null);
  const [receipt, setReceipt] = useState<Sale | null>(null);

  const start = useMutation({
    mutationFn: openSale,
    onSuccess: (opened) => {
      setReceipt(null);
      setSale(opened);
    },
  });

  const begin = () => {
    const code = registerCode.trim().toUpperCase();
    saveRegister(code);
    start.mutate(code);
  };

  // With the phase flag off, the app shows nothing but Coming soon
  if (!config.featurePos) {
    return <ComingSoon />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-4 text-white">
        <div>
          <p className="text-lg font-semibold">Point of Sale</p>
          <p className="text-sm text-slate-400">
            {sale ? `${sale.registerCode} · ${sale.saleNumber}` : "Ready for the next customer"}
          </p>
        </div>
        <p className="text-right text-sm text-slate-400">{CURRENT_USER}</p>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        {sale ? (
          <SaleScreen
            sale={sale}
            onChange={setSale}
            onFinished={(finished) => {
              setSale(null);
              if (finished.status === "COMPLETED") {
                setReceipt(finished);
              }
            }}
          />
        ) : (
          <div className="mx-auto max-w-md space-y-4">
            {receipt && <Receipt sale={receipt} />}

            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Register</span>
                <input
                  value={registerCode}
                  onChange={(event) => setRegisterCode(event.target.value)}
                  className={`${inputClass} uppercase`}
                />
              </label>

              {start.isError && (
                <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {start.error.message}
                </p>
              )}

              <Button
                onClick={begin}
                disabled={!registerCode.trim() || start.isPending}
                className="mt-4 w-full py-4 text-lg"
              >
                {start.isPending ? "Opening…" : receipt ? "Next customer" : "Start sale"}
              </Button>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function SaleScreen({
  sale,
  onChange,
  onFinished,
}: {
  sale: Sale;
  onChange: (sale: Sale) => void;
  onFinished: (sale: Sale) => void;
}) {
  const prices = useQuery({ queryKey: ["prices"], queryFn: getPrices });
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [cash, setCash] = useState("");
  const [card, setCard] = useState("");

  // Only the latest problem is shown: starting any action clears the last one
  const [error, setError] = useState<Error | null>(null);
  const handlers = { onMutate: () => setError(null), onError: setError };

  const add = useMutation({ mutationFn: addProduct, onSuccess: onChange, ...handlers });
  const remove = useMutation({ mutationFn: removeProduct, onSuccess: onChange, ...handlers });
  const pay = useMutation({ mutationFn: paySale, onSuccess: onFinished, ...handlers });
  const cancel = useMutation({ mutationFn: cancelSale, onSuccess: onFinished, ...handlers });

  const busy = [add, remove, pay, cancel].some((m) => m.isPending);

  const scan = (event: FormEvent) => {
    event.preventDefault();
    const count = Number(quantity);

    if (!sku.trim() || !Number.isInteger(count) || count < 1) return;

    add.mutate(
      { saleId: sale.id, sku: sku.trim(), quantity: count },
      {
        onSuccess: () => {
          setSku("");
          setQuantity("1");
        },
      },
    );
  };

  const cashCents = cash.trim() ? toCents(cash) : 0;
  const cardCents = card.trim() ? toCents(card) : 0;
  const typedWell = cashCents !== null && cardCents !== null;
  const paidCents = typedWell ? cashCents + cardCents : 0;
  const changeCents = Math.max(paidCents - sale.totalCents, 0);

  const takePayment = () => {
    if (!typedWell) return;

    const payments: { method: PaymentMethod; amountCents: number }[] = [];
    if (cashCents > 0) payments.push({ method: "CASH", amountCents: cashCents });
    if (cardCents > 0) payments.push({ method: "CARD", amountCents: cardCents });

    pay.mutate({ saleId: sale.id, payments });
  };

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {/* Left: finding products */}
      <section className="space-y-4 md:col-span-3">
        <form onSubmit={scan} className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium">Scan or type a product code</p>
          <div className="flex gap-2">
            <input
              autoFocus
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder="e.g. RICE-1KG"
              aria-label="Product code"
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-3 text-lg uppercase"
            />
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              aria-label="Quantity"
              className="w-20 shrink-0 rounded-md border border-slate-300 px-3 py-3 text-lg"
            />
            <Button type="submit" disabled={busy || !sku.trim()} className="px-5 text-base">
              Add
            </Button>
          </div>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium">Or tap a product</p>
          {prices.isPending ? (
            <p className="text-sm text-slate-500">Loading products…</p>
          ) : prices.isError ? (
            <p className="text-sm text-red-700">{prices.error.message}</p>
          ) : prices.data.length === 0 ? (
            <p className="text-sm text-slate-500">No prices set yet. A manager sets them first.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {prices.data.map((price) => (
                <button
                  key={price.id}
                  type="button"
                  disabled={busy}
                  onClick={() => add.mutate({ saleId: sale.id, sku: price.sku, quantity: 1 })}
                  className="rounded-md border border-slate-200 p-3 text-left hover:border-slate-400 disabled:opacity-50"
                >
                  <p className="font-medium leading-tight">{price.productName}</p>
                  <p className="mt-1 text-sm text-slate-500">{kes(price.priceCents)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Right: the basket and the money */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
        {error && (
          <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error.message}
          </p>
        )}

        {sale.products.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Nothing scanned yet</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sale.products.map((product) => (
              <li key={product.id} className="flex items-start justify-between gap-2 py-2">
                <div>
                  <p className="font-medium">{product.productName}</p>
                  <p className="text-sm text-slate-500">
                    {product.quantity} × {kes(product.unitPriceCents)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{kes(product.totalCents)}</p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove.mutate({ saleId: sale.id, saleProductId: product.id })}
                    aria-label={`Remove ${product.productName}`}
                    className="rounded-md px-2 py-1 text-lg leading-none text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2 border-t border-slate-200 pt-3">
          <div className="flex justify-between text-2xl font-bold">
            <span>Total</span>
            <span>{kes(sale.totalCents)}</span>
          </div>
          <p className="text-right text-sm text-slate-500">includes VAT {kes(sale.taxCents)}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Cash (KES)</span>
            <input
              inputMode="decimal"
              value={cash}
              onChange={(event) => setCash(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Card (KES)</span>
            <input
              inputMode="decimal"
              value={card}
              onChange={(event) => setCard(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            disabled={sale.totalCents === 0}
            onClick={() => {
              setCash(toShillings(sale.totalCents));
              setCard("");
            }}
          >
            Exact cash
          </Button>
          <Button
            variant="secondary"
            disabled={sale.totalCents === 0}
            onClick={() => {
              const cashPart = cashCents ?? 0;
              setCard(toShillings(Math.max(sale.totalCents - cashPart, 0)));
            }}
          >
            Rest on card
          </Button>
        </div>

        {!typedWell ? (
          <p className="mt-3 text-sm text-red-700">Amounts look like 200 or 199.50</p>
        ) : (
          changeCents > 0 && (
            <p className="mt-3 text-lg font-semibold text-green-700">Change {kes(changeCents)}</p>
          )
        )}

        <Button
          onClick={takePayment}
          disabled={busy || !typedWell || sale.products.length === 0 || paidCents === 0}
          className="mt-4 w-full py-4 text-lg"
        >
          {pay.isPending ? "Taking payment…" : "Take payment"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => cancel.mutate(sale.id)}
          disabled={busy}
          className="mt-2 w-full"
        >
          Cancel sale
        </Button>
      </section>
    </div>
  );
}

function Receipt({ sale }: { sale: Sale }) {
  return (
    <section className="rounded-lg border border-green-200 bg-white p-4">
      <p className="text-sm text-green-700">Paid</p>
      <h1 className="text-xl font-semibold">{sale.saleNumber}</h1>
      <p className="text-sm text-slate-500">
        {sale.registerCode} · {sale.completedAt && new Date(sale.completedAt).toLocaleString()}
      </p>

      <ul className="my-3 divide-y divide-slate-100 text-sm">
        {sale.products.map((product) => (
          <li key={product.id} className="flex justify-between py-1.5">
            <span>
              {product.quantity} × {product.productName}
            </span>
            <span>{kes(product.totalCents)}</span>
          </li>
        ))}
      </ul>

      <dl className="space-y-1 border-t border-slate-200 pt-2 text-sm">
        <div className="flex justify-between text-base font-semibold">
          <dt>Total</dt>
          <dd>{kes(sale.totalCents)}</dd>
        </div>
        <div className="flex justify-between text-slate-500">
          <dt>of which VAT</dt>
          <dd>{kes(sale.taxCents)}</dd>
        </div>
        {sale.payments.map((payment) => (
          <div key={payment.id} className="flex justify-between">
            <dt>{payment.method === "CASH" ? "Cash" : "Card"}</dt>
            <dd>{kes(payment.amountCents)}</dd>
          </div>
        ))}
        {sale.changeCents > 0 && (
          <div className="flex justify-between text-lg font-semibold text-green-700">
            <dt>Change</dt>
            <dd>{kes(sale.changeCents)}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function ComingSoon() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
        <h1 className="text-xl font-semibold">Coming soon</h1>
        <p className="mt-2 text-sm text-slate-500">Point of Sale is not enabled here.</p>
      </div>
    </div>
  );
}
