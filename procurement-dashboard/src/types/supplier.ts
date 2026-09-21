// What the dashboard needs from Vendor Management when a buyer picks a supplier
export type Supplier = {
  id: string;
  name: string;
  email: string;
  paymentTerms: string;
  status: string;
};

export type SupplierOffer = {
  supplierId: string;
  supplierName: string;
  paymentTerms: string;
  catalogItemId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  leadTimeDays: number;
};
