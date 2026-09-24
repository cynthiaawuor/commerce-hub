import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

// The code cannot change: stock movements and other services already quote it
class UpdateLocationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}

export { UpdateLocationDto };
