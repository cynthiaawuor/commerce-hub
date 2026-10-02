// The chart of accounts. Kept in code rather than a table: postings name accounts by
// constant, so an account cannot be renamed or removed without the code noticing.

type AccountType = "ASSET" | "LIABILITY" | "REVENUE" | "EXPENSE";

type Account = { code: string; name: string; type: AccountType };

const ACCOUNTS = {
  CASH: { code: "1000", name: "Cash in registers", type: "ASSET" },
  // Card takings the bank has yet to settle
  CARD_CLEARING: { code: "1010", name: "Card settlements due", type: "ASSET" },
  // Suppliers are paid from here; it can run negative until capital is recorded
  BANK: { code: "1020", name: "Bank", type: "ASSET" },
  INVENTORY: { code: "1200", name: "Inventory", type: "ASSET" },
  ACCOUNTS_PAYABLE: { code: "2000", name: "Accounts payable", type: "LIABILITY" },
  VAT_PAYABLE: { code: "2100", name: "VAT payable", type: "LIABILITY" },
  SALES_REVENUE: { code: "4000", name: "Sales revenue", type: "REVENUE" },
  COST_OF_GOODS_SOLD: { code: "5000", name: "Cost of goods sold", type: "EXPENSE" },
  CASH_OVER_SHORT: { code: "6100", name: "Cash over / short", type: "EXPENSE" },
} as const satisfies Record<string, Account>;

const CHART: readonly Account[] = Object.values(ACCOUNTS);

// Assets and expenses grow with debits; liabilities and revenue with credits. A
// balance is reported on the side it normally sits, so money owed reads as positive.
const normalBalance = (type: AccountType, debitCents: number, creditCents: number) =>
  type === "ASSET" || type === "EXPENSE" ? debitCents - creditCents : creditCents - debitCents;

export { ACCOUNTS, CHART, normalBalance, type Account, type AccountType };
