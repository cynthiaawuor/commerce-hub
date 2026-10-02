// The money rules at the till, kept free of the database so they are easy to test.

type PaymentMethod = "CASH" | "CARD";
type Tender = { method: PaymentMethod; amountCents: number };

// Shelf prices include VAT, so the tax is the part of the total that is VAT:
// at 16%, KES 116 holds KES 16 of VAT.
const vatInside = (totalCents: number, ratePercent: number) =>
  Math.round((totalCents * ratePercent) / (100 + ratePercent));

type Settlement =
  | { ok: true; paidCents: number; changeCents: number }
  | { ok: false; reason: string };

const kes = (cents: number) => `KES ${(cents / 100).toFixed(2)}`;

// Is this enough money, handed over the right way?
// - Change only ever comes out of the cash drawer, so a card is charged at most what
//   cash has not already covered. Overcharging a card to hand back cash is refused.
// - Everything together must cover the total.
const settlePayments = (totalCents: number, tenders: Tender[]): Settlement => {
  const cashCents = tenders
    .filter((tender) => tender.method === "CASH")
    .reduce((sum, tender) => sum + tender.amountCents, 0);
  const cardCents = tenders
    .filter((tender) => tender.method === "CARD")
    .reduce((sum, tender) => sum + tender.amountCents, 0);

  const leftForCard = Math.max(totalCents - cashCents, 0);

  if (cardCents > leftForCard) {
    return {
      ok: false,
      reason: `Charge the card ${kes(leftForCard)} at most; change is only given in cash`,
    };
  }

  const paidCents = cashCents + cardCents;

  if (paidCents < totalCents) {
    return { ok: false, reason: `${kes(totalCents - paidCents)} still to pay` };
  }

  return { ok: true, paidCents, changeCents: paidCents - totalCents };
};

export { settlePayments, vatInside, type PaymentMethod, type Tender };
