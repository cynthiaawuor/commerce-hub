import { endOf, parseAsOf, parsePeriod } from "../core/dates";
import { BadRequestError } from "../core/http-error";
import * as ledgerRepository from "../ledger/ledger.repository";
import * as saleRepository from "../sales/sales.repository";
import * as maths from "./report-maths";

// ?from=2026-09-01&to=2026-09-30, this month so far when left out
const getProfitAndLoss = async (from: unknown, to: unknown) => {
  const period = parsePeriod(from, to);

  const [sums, uncostedSales] = await Promise.all([
    ledgerRepository.sumByAccountBetween(period.startsAt, period.endsBefore),
    saleRepository.countUncosted(period),
  ]);

  return {
    from: period.from,
    to: period.to,
    ...maths.profitAndLoss(sums),
    // Sales whose cost is not booked yet: while this is above zero, profit is overstated
    uncostedSales,
  };
};

// ?asOf=2026-09-30, today when left out
const getBalanceSheet = async (asOfQuery: unknown) => {
  const asOf = parseAsOf(asOfQuery);
  const sums = await ledgerRepository.sumByAccount(endOf(asOf));

  return { asOf, ...maths.balanceSheet(sums) };
};

// ?by=product (the default) or store, over the same period as profit and loss
const getProfitability = async (by: unknown, from: unknown, to: unknown) => {
  if (by !== undefined && by !== "product" && by !== "store") {
    throw new BadRequestError("Invalid filter", { by: ["must be product or store"] });
  }

  const period = parsePeriod(from, to);
  const groupedBy = by === "store" ? "store" : "product";

  const rows =
    groupedBy === "store"
      ? maths.withProfit(await saleRepository.sumByStore(period))
      : maths.withProfit(await saleRepository.sumByProduct(period));

  return {
    from: period.from,
    to: period.to,
    by: groupedBy,
    rows,
    uncostedSales: await saleRepository.countUncosted(period),
  };
};

export { getBalanceSheet, getProfitAndLoss, getProfitability };
