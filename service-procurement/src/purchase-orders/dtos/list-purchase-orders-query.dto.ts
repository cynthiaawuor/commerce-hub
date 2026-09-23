import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import {
  PURCHASE_ORDER_STATUSES,
  type PurchaseOrderStatus,
} from "../purchase-order-status";

// Query strings arrive as text, so convert page/limit to numbers before validating.
// A missing value must stay undefined: Number(undefined) is NaN, which @IsOptional
// would not skip and @IsInt would then reject.
const toNumber = ({ value }: { value: unknown }) =>
  value === undefined || value === null || value === "" ? undefined : Number(value);

class ListPurchaseOrdersQueryDto {
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

  @IsOptional()
  @IsIn([...PURCHASE_ORDER_STATUSES])
  status: PurchaseOrderStatus;

  @IsOptional()
  @IsString()
  supplierId: string;
}

export { ListPurchaseOrdersQueryDto };
