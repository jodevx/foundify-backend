import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  @MaxLength(150, { message: 'El título no puede superar 150 caracteres' })
  @Transform(({ value }) => value?.trim())
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(20, { message: 'La descripción debe tener al menos 20 caracteres' })
  @MaxLength(2000, { message: 'La descripción no puede superar 2000 caracteres' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  // El status se valida en el servicio según el tipo del item
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  categorySlug?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  location?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe estar en formato YYYY-MM-DD' })
  eventDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  material?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  brand?: string;
}
