// Mirrors the CatalogItem model in service-vendor/src/prisma/contract.prisma
export type CatalogItem = {
  id: string;
  supplierId: string;
  productId: string; // product ID in the Inventory service
  name: string;
  description: string;
  unitPrice: number;
  leadTimeDays: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateCatalogItemInput = Pick<
  CatalogItem,
  "productId" | "name" | "description" | "unitPrice" | "leadTimeDays"
>;

export type UpdateCatalogItemInput = Partial<CreateCatalogItemInput>;
