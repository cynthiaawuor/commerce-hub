import { Transform } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

// One product counted off the truck. Validated per entry by the service, which reports
// problems as products[0].quantityDelivered and so on.
class ReceivedProductDto {
  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  productId: string;

  @IsInt()
  @Min(0)
  quantityDelivered: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantityDamaged: number;
}

// What the dock clerk submits once a truck has been checked
class CreateGoodsReceivedNoteDto {
  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  expectedDeliveryId: string;

  @IsArray()
  @ArrayNotEmpty()
  products: unknown[];

  // Defaults to the main warehouse
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value))
  locationCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(trim)
  notes: string;
}

export { CreateGoodsReceivedNoteDto, ReceivedProductDto };
