// The sums behind the reports, kept free of the database so they are easy to test.
import { ACCOUNTS, CHART, normalBalance, type Account } from "../ledger/accounts";

type AccountSum = { accountCode: string; debitCents: number; creditCents: number };

// An account's balance on the side it normally sits; zero when nothing was posted
const balanceOf = (sums: AccountSum[], account: Account) => {
  const sum = sums.find((row) => row.accountCode === account.code);

  return normalBalance(account.type, sum?.debitCents ?? 0, sum?.creditCents ?? 0);
};

// One decimal place; null when there is nothing to divide by
const marginPercent = (profitCents: number, revenueCents: number) =>
  revenueCents === 0 ? null : Math.round((profitCents / revenueCents) * 1000) / 10;

// Are we making money? Revenue, less what the goods cost, less what the tills lost.
const profitAndLoss = (sums: AccountSum[]) => {
  const revenueCents = balanceOf(sums, ACCOUNTS.SALES_REVENUE);
  const costOfGoodsSoldCents = balanceOf(sums, ACCOUNTS.COST_OF_GOODS_SOLD);
  const grossProfitCents = revenueCents - costOfGoodsSoldCents;
  // An expense: positive when tills were short overall, negative when over
  const cashOverShortCents = balanceOf(sums, ACCOUNTS.CASH_OVER_SHORT);

  return {
    revenueCents,
    costOfGoodsSoldCents,
    grossProfitCents,
    grossMarginPercent: marginPercent(grossProfitCents, revenueCents),
    cashOverShortCents,
    netProfitCents: grossProfitCents - cashOverShortCents,
  };
};

// What do we own and what do we owe? Assets always equal liabilities plus equity;
// with no capital recorded, equity here is the profit kept so far.
const balanceSheet = (sums: AccountSum[]) => {
  const section = (type: Account["type"]) =>
    CHART.filter((account) => account.type === type).map((account) => ({
      code: account.code,
      name: account.name,
      balanceCents: balanceOf(sums, account),
    }));

  const assets = section("ASSET");
  const liabilities = section("LIABILITY");
  const total = (rows: { balanceCents: number }[]) =>
    rows.reduce((sum, row) => sum + row.balanceCents, 0);

  const retainedEarningsCents = profitAndLoss(sums).netProfitCents;
  const totalAssetsCents = total(assets);
  const totalLiabilitiesCents = total(liabilities);

  return {
    assets,
    totalAssetsCents,
    liabilities,
    totalLiabilitiesCents,
    equity: [{ name: "Retained earnings", balanceCents: retainedEarningsCents }],
    totalEquityCents: retainedEarningsCents,
    balanced: totalAssetsCents === totalLiabilitiesCents + retainedEarningsCents,
  };
};

type Sold = { quantity: number; revenueCents: number; costCents: number };

// Adds profit and margin to what a product or store sold, most profitable first
const withProfit = <T extends Sold>(rows: T[]) =>
  rows
    .map((row) => {
      const grossProfitCents = row.revenueCents - row.costCents;

      return {
        ...row,
        grossProfitCents,
        grossMarginPercent: marginPercent(grossProfitCents, row.revenueCents),
      };
    })
    .sort((a, b) => b.grossProfitCents - a.grossProfitCents);

export { balanceSheet, marginPercent, profitAndLoss, withProfit, type AccountSum };
