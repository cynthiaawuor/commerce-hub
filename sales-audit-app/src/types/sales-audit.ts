// Shapes returned by service-sales-audit; see contracts/openapi/sales-audit.yaml

export type RegisterDay = {
  id: string;
  storeCode: string;
  registerCode: string;
  businessDate: string;
  status: "OPEN" | "CLOSED";
  salesCount: number;
  expectedCashCents: number;
  expectedCardCents: number;
  expectedTotalCents: number;
  countedCashCents: number | null;
  countedCardCents: number | null;
  cashDifferenceCents: number | null;
  cardDifferenceCents: number | null;
  differenceCents: number | null;
  explanation: string | null;
  closedBy: string | null;
  closedAt: string | null;
  checkedWithPos: boolean | null;
  salesAfterClose: number;
};
