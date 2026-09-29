// Shapes returned by service-pos; see contracts/openapi/pos.yaml

export type ProductPrice = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  priceCents: number;
};

export type SaleProduct = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};

export type PaymentMethod = "CASH" | "CARD";

export type Payment = {
  id: string;
  method: PaymentMethod;
  amountCents: number;
};

export type Sale = {
  id: string;
  saleNumber: string;
  storeCode: string;
  registerCode: string;
  cashierId: string;
  status: "OPEN" | "COMPLETED" | "CANCELLED";
  totalCents: number;
  taxCents: number;
  paidCents: number;
  changeCents: number;
  completedAt: string | null;
  products: SaleProduct[];
  payments: Payment[];
};
