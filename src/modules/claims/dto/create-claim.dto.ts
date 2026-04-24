import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateClaimDto {
  @IsString()
  @IsNotEmpty({ message: 'El mensaje de reclamo es requerido' })
  @MinLength(20, { message: 'El mensaje debe tener al menos 20 caracteres' })
  @MaxLength(1000, { message: 'El mensaje no puede superar 1000 caracteres' })
  @Transform(({ value }) => value?.trim())
  claimMessage: string;
}
