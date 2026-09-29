import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

// The worker confirms where the goods went. Leaving shelfCode out means "where you
// suggested"; giving one means they chose a different shelf.
class CompletePutawayTaskDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value))
  shelfCode: string;
}

export { CompletePutawayTaskDto };
