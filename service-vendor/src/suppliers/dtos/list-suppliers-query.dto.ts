import { Transform } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  isString,
  Max,
  Min,
} from "class-validator";
import SupplierStatus from "../supplier-status.enum";

// Query strings arrive as text, so convert page/limit to numbers before validating.

const toNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return Number(value);
};
class ListSuppliersQueryDto {
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  page: number;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  // Matches name or email, case-insensitively
  @IsOptional()
  @Transform(({ value }) => (isString(value) ? value.trim() : value))
  @IsString()
  search: string;

  @IsOptional()
  @IsEnum(SupplierStatus)
  status: SupplierStatus;
}

export { ListSuppliersQueryDto };
