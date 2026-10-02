// Shapes returned by service-financials; see contracts/openapi/financials.yaml

export type ProfitAndLoss = {
  from: string;
  to: string;
  revenueCents: number;
  costOfGoodsSoldCents: number;
  grossProfitCents: number;
  grossMarginPercent: number | null;
  // An expense: positive when tills were short overall, negative when over
  cashOverShortCents: number;
  netProfitCents: number;
  // Sales whose cost is not booked yet; while above zero, profit is overstated
  uncostedSales: number;
};

export type BalanceRow = { code?: string; name: string; balanceCents: number };

export type BalanceSheet = {
  asOf: string;
  assets: BalanceRow[];
  totalAssetsCents: number;
  liabilities: BalanceRow[];
  totalLiabilitiesCents: number;
  equity: BalanceRow[];
  totalEquityCents: number;
  balanced: boolean;
};

export type ProfitRow = {
  sku?: string;
  productName?: string;
  storeCode?: string;
  quantity: number;
  revenueCents: number;
  costCents: number;
  grossProfitCents: number;
  grossMarginPercent: number | null;
};

export type Profitability = {
  from: string;
  to: string;
  by: "product" | "store";
  rows: ProfitRow[];
  uncostedSales: number;
};

export type AgeBucket = "NOT_DUE" | "1_30" | "31_60" | "61_90" | "OVER_90";

export type Bill = {
  id: string;
  goodsReceivedNoteNumber: string;
  purchaseOrderNumber: string;
  // Null until the purchase order's approval has been seen
  supplierName: string | null;
  dueDate: string | null;
  receivedAt: string;
  amountCents: number;
  paidCents: number;
  outstandingCents: number;
  status: "OPEN" | "PAID";
  daysOverdue: number;
  ageBucket: AgeBucket;
};

export type SupplierBalance = {
  supplierId: string | null;
  supplierName: string;
  billCount: number;
  outstandingCents: number;
  overdueCents: number;
  nextDueDate: string | null;
  buckets: Record<AgeBucket, number>;
};

export type SupplierBalances = {
  suppliers: SupplierBalance[];
  totals: { outstandingCents: number; overdueCents: number; buckets: Record<AgeBucket, number> };
};

export type Commitment = {
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierName: string;
  totalCents: number;
  receivedCents: number;
  outstandingCents: number;
  approvedAt: string;
};

export type Commitments = { commitments: Commitment[]; totalOutstandingCents: number };

export type Account = {
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "REVENUE" | "EXPENSE";
  debitCents: number;
  creditCents: number;
  balanceCents: number;
};

export type AccountBalances = {
  asOf: string;
  accounts: Account[];
  totalDebitCents: number;
  totalCreditCents: number;
  balanced: boolean;
};

export type JournalSource = "GOODS_RECEIVED" | "SALE" | "SALE_COST" | "DAY_CLOSED" | "SUPPLIER_PAYMENT";

export type JournalEntry = {
  id: string;
  source: JournalSource;
  reference: string;
  description: string;
  storeCode: string | null;
  occurredAt: string;
  lines: { id: string; accountCode: string; accountName: string; debitCents: number; creditCents: number }[];
};

export type JournalPage = {
  data: JournalEntry[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};
