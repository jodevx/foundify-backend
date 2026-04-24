import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ItemFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  type?: string;

  // Comma-separated slugs: "llaves_y_controles,documentos_y_tarjetas"
  @IsOptional()
  @IsString()
  category?: string;

  // Comma-separated statuses
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;
}
