import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  customerRef!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}
