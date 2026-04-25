import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ItemType } from '../enums/item-type.enum';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  @MaxLength(150, { message: 'El título no puede superar 150 caracteres' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'La descripción debe tener al menos 20 caracteres' })
  @MaxLength(2000, { message: 'La descripción no puede superar 2000 caracteres' })
  @Transform(({ value }) => value?.trim())
  description: string;

  @IsEnum(ItemType, { message: 'El tipo debe ser "lost_item" o "found_item"' })
  type: ItemType;

  @IsString()
  @IsNotEmpty({ message: 'La categoría es requerida' })
  categorySlug: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'La ubicación debe tener al menos 5 caracteres' })
  @MaxLength(255, { message: 'La ubicación no puede superar 255 caracteres' })
  @Transform(({ value }) => value?.trim())
  location: string;

  @IsDateString({}, { message: 'La fecha debe estar en formato YYYY-MM-DD' })
  eventDate: string;

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
