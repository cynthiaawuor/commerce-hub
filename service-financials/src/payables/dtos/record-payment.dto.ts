import { Transform } from "class-transformer";
import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

// Money paid to a supplier towards one bill, in cents
class RecordPaymentDto {
  @IsInt()
  @Min(1)
  amountCents: number;

  // The bank's or the cheque's reference
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  reference: string;

  // Defaults to now; set it when recording a payment made earlier
  @IsOptional()
  @IsDateString()
  paidAt: string;
}

export { RecordPaymentDto };
