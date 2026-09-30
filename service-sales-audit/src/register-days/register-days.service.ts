import type { CurrentUser } from "../core/current-user";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../core/http-error";
import parseAndValidate from "../core/validation";
import type { DayClosedPayload } from "../events/event-types";
import * as posClient from "../pos/pos.client";
import { checkClose } from "./close-rules";
import { CloseRegisterDayDto } from "./dtos/close-register-day.dto";
import * as registerDayRepository from "./register-days.repository";

// Each day carries its expected total, which is what the manager counts against
const withTotals = <
  T extends {
    expectedCashCents: number;
    expectedCardCents: number;
    cashDifferenceCents: number | null;
    cardDifferenceCents: number | null;
  },
>(
  day: T,
) => ({
  ...day,
  expectedTotalCents: day.expectedCashCents + day.expectedCardCents,
  differenceCents:
    day.cashDifferenceCents === null || day.cardDifferenceCents === null
      ? null
      : day.cashDifferenceCents + day.cardDifferenceCents,
});

// ?status=OPEN (the default) or CLOSED, which is the discrepancy log
const listRegisterDays = async (status: unknown) => {
  if (status === undefined || status === "OPEN") {
    return (await registerDayRepository.findOpen()).map(withTotals);
  }

  if (status === "CLOSED") {
    return (await registerDayRepository.findRecentlyClosed()).map(withTotals);
  }

  throw new BadRequestError("Invalid filter", { status: ["must be OPEN or CLOSED"] });
};

const getRegisterDay = async (id: string) => {
  const day = await registerDayRepository.findById(id);

  if (!day) {
    throw new NotFoundError(`Register day ${id} not found`);
  }

  return withTotals(day);
};

// The manager has counted the drawer and the card slips
const closeRegisterDay = async (id: string, body: unknown, user: CurrentUser) => {
  if (user.role !== "MANAGER") {
    throw new ForbiddenError("Only a manager can close a register's day");
  }

  const { obj, errors } = await parseAndValidate(CloseRegisterDayDto, body);

  if (errors) {
    throw new BadRequestError("Invalid count", errors);
  }

  const day = await getRegisterDay(id);

  if (day.status !== "OPEN") {
    throw new ConflictError(`${day.registerCode} on ${day.businessDate} is already closed`);
  }

  // Signing off while sales are still on their way here would record a false shortage
  const posSummary = await posClient.getRegisterSummary(day.registerCode, day.businessDate);

  if (posSummary && posSummary.salesCount > day.salesCount) {
    throw new ConflictError(
      `Point of Sale recorded ${posSummary.salesCount} sales on ${day.registerCode} that day, ` +
        `but only ${day.salesCount} have arrived here. Wait a moment and try again.`,
    );
  }

  const explanation = obj!.explanation || null;
  const check = checkClose({
    expectedCashCents: day.expectedCashCents,
    expectedCardCents: day.expectedCardCents,
    countedCashCents: obj!.countedCashCents,
    countedCardCents: obj!.countedCardCents,
    explanation,
  });

  if (!check.ok) {
    throw new BadRequestError(check.reason, { explanation: [check.reason] });
  }

  const closedAt = new Date().toISOString();

  const event: DayClosedPayload = {
    registerDayId: day.id,
    storeCode: day.storeCode,
    registerCode: day.registerCode,
    businessDate: day.businessDate,
    salesCount: day.salesCount,
    expectedCashCents: day.expectedCashCents,
    expectedCardCents: day.expectedCardCents,
    countedCashCents: obj!.countedCashCents,
    countedCardCents: obj!.countedCardCents,
    cashDifferenceCents: check.cashDifferenceCents,
    cardDifferenceCents: check.cardDifferenceCents,
    differenceCents: check.differenceCents,
    explanation,
    closedBy: user.id,
    closedAt,
  };

  const closed = await registerDayRepository.close(
    day.id,
    {
      countedCashCents: obj!.countedCashCents,
      countedCardCents: obj!.countedCardCents,
      cashDifferenceCents: check.cashDifferenceCents,
      cardDifferenceCents: check.cardDifferenceCents,
      explanation,
      closedBy: user.id,
      closedAt,
      checkedWithPos: posSummary !== null,
    },
    event,
  );

  if (!closed) {
    throw new ConflictError(`${day.registerCode} on ${day.businessDate} was closed by someone else`);
  }

  return getRegisterDay(day.id);
};

export { closeRegisterDay, getRegisterDay, listRegisterDays };
