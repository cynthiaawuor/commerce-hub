import { Transform } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

// Query strings arrive as text, so convert page/limit to numbers before validating.
class ListSuppliersQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;
}

export { ListSuppliersQueryDto };
