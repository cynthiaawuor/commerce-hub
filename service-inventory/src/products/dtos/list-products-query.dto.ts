import { Transform } from "class-transformer";
import { IsBooleanString, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

// Query strings arrive as text, so convert page/limit to numbers before validating.
// A missing value must stay undefined: Number(undefined) is NaN, which @IsOptional
// would not skip and @IsInt would then reject.
const toNumber = ({ value }: { value: unknown }) =>
  value === undefined || value === null || value === "" ? undefined : Number(value);

class ListProductsQueryDto {
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

  // Matches SKU or name, case-insensitively
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  search: string;

  @IsOptional()
  @IsBooleanString()
  isActive: string;
}

export { ListProductsQueryDto };
