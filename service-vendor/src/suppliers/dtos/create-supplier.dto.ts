import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from "class-validator";

class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber()
  phone: string;

  @IsString()
  @IsNotEmpty()
  paymentTerms: string;
}

export { CreateSupplierDto };
