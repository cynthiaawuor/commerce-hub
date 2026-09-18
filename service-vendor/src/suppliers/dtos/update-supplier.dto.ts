import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString } from "class-validator";
import SupplierStatus from "../entities/supplier-status.enum";

class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsPhoneNumber()
  phone: string;

  @IsOptional()
  @IsString()
  paymentTerms: string;

  @IsEnum(SupplierStatus)
  @IsOptional()
  status: SupplierStatus;
}

export { UpdateSupplierDto };
