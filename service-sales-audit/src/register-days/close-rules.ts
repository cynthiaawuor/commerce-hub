// The rules for closing a register's day, kept free of the database so they are easy
// to test.

const MIN_EXPLANATION_LENGTH = 10;

type Count = {
  expectedCashCents: number;
  expectedCardCents: number;
  countedCashCents: number;
  countedCardCents: number;
  explanation: string | null;
};

type CloseCheck =
  | {
      ok: true;
      cashDifferenceCents: number;
      cardDifferenceCents: number;
      differenceCents: number;
    }
  | { ok: false; reason: string };

const kes = (cents: number) => `KES ${(Math.abs(cents) / 100).toFixed(2)}`;

// Counted minus expected, in words: "KES 50.00 short"
const describeDifference = (differenceCents: number) =>
  differenceCents === 0
    ? "balanced"
    : `${kes(differenceCents)} ${differenceCents < 0 ? "short" : "over"}`;

// Does the count balance, and if not, has the manager said why?
// Cash and card slips are compared separately: a card shortfall and a cash surplus of
// the same size still need explaining, because the money is in the wrong place.
const checkClose = (count: Count): CloseCheck => {
  const cashDifferenceCents = count.countedCashCents - count.expectedCashCents;
  const cardDifferenceCents = count.countedCardCents - count.expectedCardCents;
  const differenceCents = cashDifferenceCents + cardDifferenceCents;

  const balanced = cashDifferenceCents === 0 && cardDifferenceCents === 0;
  const explained = (count.explanation?.trim().length ?? 0) >= MIN_EXPLANATION_LENGTH;

  if (!balanced && !explained) {
    const parts = [
      cashDifferenceCents !== 0 && `cash ${describeDifference(cashDifferenceCents)}`,
      cardDifferenceCents !== 0 && `card slips ${describeDifference(cardDifferenceCents)}`,
    ].filter(Boolean);

    return {
      ok: false,
      reason: `The count does not match (${parts.join(", ")}). Explain why in at least ${MIN_EXPLANATION_LENGTH} characters before closing.`,
    };
  }

  return { ok: true, cashDifferenceCents, cardDifferenceCents, differenceCents };
};

export { checkClose, describeDifference };
