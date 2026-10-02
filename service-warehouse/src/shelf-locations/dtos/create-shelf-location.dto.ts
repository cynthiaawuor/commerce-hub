import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, Matches, MaxLength, Min } from "class-validator";

const trimUpper = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

// A supervisor adds a shelf once it is labelled on the rack
class CreateShelfLocationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[A-Z0-9-]+$/, { message: "code may only use letters, numbers and dashes" })
  @Transform(trimUpper)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Transform(trimUpper)
  zone: string;

  @IsInt()
  @Min(0)
  distanceFromDock: number;

  @IsInt()
  @Min(1)
  capacityUnits: number;
}

export { CreateShelfLocationDto };
