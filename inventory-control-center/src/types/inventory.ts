export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unitOfMeasure: string;
  weightG: number | null;
  reorderPoint: number;
  reorderQuantity: number;
  averageCostCents: number;
  isActive: boolean;
};

export type Location = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
};

// The quantities the spec asks to be kept apart. available is calculated by the service.
export type StockLevel = {
  productId: string;
  locationId: string;
  onHand: number;
  allocated: number;
  onOrder: number;
  available: number;
  product?: { id: string; sku: string; name: string };
  location?: { id: string; code: string; name: string };
};

export type StockMovement = {
  id: string;
  type: string;
  quantity: number;
  onHandAfter: number;
  reason: string | null;
  reference: string | null;
  recordedBy: string;
  createdAt: string;
};

export type ValuationSummary = {
  totalValueCents: number;
  totalUnits: number;
  locations: {
    locationId: string;
    code: string;
    name: string;
    units: number;
    valueCents: number;
  }[];
};

export type ValuationLine = {
  sku: string;
  productName: string;
  locationCode: string;
  onHand: number;
  averageCostCents: number;
  valueCents: number;
};

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
