import { IsInt, Min } from "class-validator";

// The shelf price, VAT included, in cents: KES 180.00 is 18000
class SetPriceDto {
  @IsInt()
  @Min(1)
  priceCents: number;
}

export { SetPriceDto };
