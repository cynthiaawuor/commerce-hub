import { IsEnum, IsOptional, IsString } from "class-validator";
import SupplierStatus from "../entities/supplier-status.enum";

class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  paymentTerms: string;

  @IsEnum(SupplierStatus)
  @IsOptional()
  status: SupplierStatus;
}

export { UpdateSupplierDto };
