import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

class CreatePurchaseOrderDto {
  // Soft reference to a supplier in service-vendor
  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  supplierId: string;

  // TEMPORARY (stage 3): the client supplies these so drafts can be created before
  // Vendor Management is wired up. From stage 4 they are read from service-vendor
  // and locked onto the order, and both fields leave this DTO.
  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  supplierName: string;

  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  paymentTerms: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(trim)
  notes: string;
}

export { CreatePurchaseOrderDto };
