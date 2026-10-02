import type {
  AccountBalances,
  BalanceSheet,
  Bill,
  Commitments,
  JournalPage,
  JournalSource,
  ProfitAndLoss,
  Profitability,
  SupplierBalances,
} from "../types/financials";
import { apiRequest } from "./api-client";
import type { Period } from "./dates";

const get = async <T>(path: string) => (await apiRequest<{ data: T }>(path)).data;

const range = ({ from, to }: Period) => `from=${from}&to=${to}`;

export const getProfitAndLoss = (period: Period) =>
  get<ProfitAndLoss>(`/reports/profit-and-loss?${range(period)}`);

export const getBalanceSheet = (asOf: string) =>
  get<BalanceSheet>(`/reports/balance-sheet?asOf=${asOf}`);

export const getProfitability = (by: "product" | "store", period: Period) =>
  get<Profitability>(`/reports/profitability?by=${by}&${range(period)}`);

export const getOpenBills = () => get<Bill[]>("/bills?status=OPEN");

export const getSupplierBalances = () => get<SupplierBalances>("/bills/suppliers");

export const getCommitments = () => get<Commitments>("/commitments");

export const recordPayment = async ({
  billId,
  amountCents,
  reference,
}: {
  billId: string;
  amountCents: number;
  reference: string;
}) =>
  (
    await apiRequest<{ data: Bill }>(`/bills/${billId}/payments`, {
      method: "POST",
      body: { amountCents, ...(reference.trim() ? { reference: reference.trim() } : {}) },
    })
  ).data;

export const getAccountBalances = () => get<AccountBalances>("/ledger/accounts");

// The list comes with its paging details, so it is returned whole
export const getJournalEntries = ({
  source,
  reference,
  page,
}: {
  source: JournalSource | "";
  reference: string;
  page: number;
}) => {
  const query = new URLSearchParams({ page: String(page), limit: "10" });
  if (source) query.set("source", source);
  if (reference.trim()) query.set("reference", reference.trim());

  return apiRequest<JournalPage>(`/ledger/entries?${query}`);
};
