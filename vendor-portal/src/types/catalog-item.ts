// Mirrors the CatalogItem model in service-vendor/src/prisma/contract.prisma
export type CatalogItem = {
  id: string;
  supplierId: string;
  name: string;
  description: string;
  unitPrice: number;
  unitsInStock: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateCatalogItemInput = Pick<CatalogItem, "name" | "description" | "unitPrice" | "unitsInStock">;

export type UpdateCatalogItemInput = Partial<CreateCatalogItemInput>;
