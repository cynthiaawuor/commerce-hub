import { Transform } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

// One product from a delivery. Validated per entry by the service, which reports
// problems as lines[0].quantityReceived and so on.
class ReceiptLineDto {
  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  productId: string;

  @IsInt()
  @Min(1)
  quantityReceived: number;
}

// What a delivery brought. Receiving will send this from its Goods Received Note;
// until that service exists it is called directly.
class ReceivePurchaseOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  lines: unknown[];

  // The GRN number, once Receiving issues one
  @IsOptional()
  @IsString()
  @Transform(trim)
  reference: string;
}

export { ReceiptLineDto, ReceivePurchaseOrderDto };
