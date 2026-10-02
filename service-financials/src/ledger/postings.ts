// What each business event does to the books, kept free of the database so the
// accounting is easy to test. Every function returns lines whose debits equal their
// credits; postEntry refuses anything else.
import { ACCOUNTS } from "./accounts";

type PostingLine = { accountCode: string; debitCents: number; creditCents: number };

const debit = (account: { code: string }, cents: number): PostingLine => ({
  accountCode: account.code,
  debitCents: cents,
  creditCents: 0,
});

const credit = (account: { code: string }, cents: number): PostingLine => ({
  accountCode: account.code,
  debitCents: 0,
  creditCents: cents,
});

// Zero lines say nothing and clutter the journal
const nonZero = (lines: PostingLine[]) =>
  lines.filter((line) => line.debitCents !== 0 || line.creditCents !== 0);

const isBalanced = (lines: PostingLine[]) => {
  const debits = lines.reduce((sum, line) => sum + line.debitCents, 0);
  const credits = lines.reduce((sum, line) => sum + line.creditCents, 0);

  return (
    lines.length >= 2 &&
    debits === credits &&
    debits > 0 &&
    lines.every(
      (line) =>
        Number.isInteger(line.debitCents) &&
        Number.isInteger(line.creditCents) &&
        line.debitCents >= 0 &&
        line.creditCents >= 0,
    )
  );
};

// Goods taken in: we now own the stock and owe the supplier for it
const goodsReceived = (amountCents: number) => [
  debit(ACCOUNTS.INVENTORY, amountCents),
  credit(ACCOUNTS.ACCOUNTS_PAYABLE, amountCents),
];

// A paid sale: the money came in, part of it is VAT owed to the tax authority, the
// rest is revenue
const sale = (sold: { cashCents: number; cardCents: number; taxCents: number; netCents: number }) =>
  nonZero([
    debit(ACCOUNTS.CASH, sold.cashCents),
    debit(ACCOUNTS.CARD_CLEARING, sold.cardCents),
    credit(ACCOUNTS.VAT_PAYABLE, sold.taxCents),
    credit(ACCOUNTS.SALES_REVENUE, sold.netCents),
  ]);

// The stock that left with the customer, at what it cost us
const saleCost = (costCents: number) => [
  debit(ACCOUNTS.COST_OF_GOODS_SOLD, costCents),
  credit(ACCOUNTS.INVENTORY, costCents),
];

// A till counted against what it should hold. Differences are counted minus expected:
// negative is short (money we thought we had is gone), positive is over.
const dayClosed = (difference: { cashDifferenceCents: number; cardDifferenceCents: number }) => {
  const adjust = (account: { code: string }, differenceCents: number) =>
    differenceCents < 0
      ? [debit(ACCOUNTS.CASH_OVER_SHORT, -differenceCents), credit(account, -differenceCents)]
      : [debit(account, differenceCents), credit(ACCOUNTS.CASH_OVER_SHORT, differenceCents)];

  return nonZero([
    ...adjust(ACCOUNTS.CASH, difference.cashDifferenceCents),
    ...adjust(ACCOUNTS.CARD_CLEARING, difference.cardDifferenceCents),
  ]);
};

// Paying a supplier settles what we owe from the bank
const supplierPayment = (amountCents: number) => [
  debit(ACCOUNTS.ACCOUNTS_PAYABLE, amountCents),
  credit(ACCOUNTS.BANK, amountCents),
];

export {
  dayClosed,
  goodsReceived,
  isBalanced,
  sale,
  saleCost,
  supplierPayment,
  type PostingLine,
};
