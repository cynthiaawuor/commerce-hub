import type { RegisterDay } from "../types/sales-audit";
import { apiRequest } from "./api-client";

export const getRegisterDays = async (status: "OPEN" | "CLOSED") =>
  (await apiRequest<{ data: RegisterDay[] }>(`/register-days?status=${status}`)).data;

export const closeRegisterDay = async ({
  id,
  countedCashCents,
  countedCardCents,
  explanation,
}: {
  id: string;
  countedCashCents: number;
  countedCardCents: number;
  explanation: string;
}) =>
  (
    await apiRequest<{ data: RegisterDay }>(`/register-days/${id}/close`, {
      method: "POST",
      body: {
        countedCashCents,
        countedCardCents,
        ...(explanation.trim() ? { explanation: explanation.trim() } : {}),
      },
    })
  ).data;
