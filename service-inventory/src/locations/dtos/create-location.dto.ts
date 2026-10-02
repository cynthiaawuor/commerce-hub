import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

const upper = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

// A place stock can be. Inventory records where stock is, not what kind of place it is
// or what happens there.
class CreateLocationDto {
  // Short code people use: WH-MAIN, STORE-3
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Transform(upper)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(trim)
  name: string;
}

export { CreateLocationDto };
