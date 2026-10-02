// Shapes returned by service-warehouse; see contracts/openapi/warehouse.yaml

export type ShelfProduct = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
};

export type ShelfLocation = {
  id: string;
  code: string;
  zone: string;
  distanceFromDock: number;
  capacityUnits: number;
  occupiedUnits: number;
  freeUnits: number;
  products: ShelfProduct[];
};

export type PutawayTask = {
  id: string;
  goodsReceivedNoteNumber: string;
  purchaseOrderNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  status: "PENDING" | "COMPLETED";
  suggestedShelfCode: string | null;
  shelfCode: string | null;
  completedBy: string | null;
  completedAt: string | null;
  createdAt: string;
};
