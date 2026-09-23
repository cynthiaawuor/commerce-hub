import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength } from "class-validator";

class DismissSuggestionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  reason: string;
}

export { DismissSuggestionDto };
