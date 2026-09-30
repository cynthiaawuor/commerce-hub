import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

// What the manager counted in the drawer and the card slips, in cents
class CloseRegisterDayDto {
  @IsInt()
  @Min(0)
  countedCashCents: number;

  @IsInt()
  @Min(0)
  countedCardCents: number;

  // Required by the service when the count does not match
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  explanation: string;
}

export { CloseRegisterDayDto };
