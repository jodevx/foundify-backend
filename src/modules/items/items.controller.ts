import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemFiltersDto } from './dto/item-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CloudinaryService } from '../../shared/storage/cloudinary.service';

@Controller('items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ─── Crear publicación (requiere auth) ──────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 5242880 } }))
  async create(
    @Body() dto: CreateItemDto,
    @UploadedFile()
    file:
      | {
          buffer: Buffer;
          mimetype: string;
        }
      | undefined,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).userId;
    let photoUrl: string | undefined;

    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('El archivo debe ser una imagen');
      }
      photoUrl = await this.cloudinaryService.uploadItemPhoto({
        buffer: file.buffer,
      });
    }

    return this.itemsService.create(dto, userId, photoUrl);
  }

  // ─── Listar publicaciones (público, usuario opcional) ─────────────────────────
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() filters: ItemFiltersDto, @Req() req: Request) {
    const userId = (req.user as any)?.userId;
    return this.itemsService.findAll(filters, userId);
  }

  // ─── Ver detalle (público, usuario opcional) ──────────────────────────────────
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any)?.userId;
    return this.itemsService.findOne(id, userId);
  }

  // ─── Editar publicación (requiere auth + dueño) ──────────────────────────────
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 5242880 } }))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
    @UploadedFile()
    file:
      | {
          buffer: Buffer;
          mimetype: string;
        }
      | undefined,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).userId;
    let photoUrl: string | undefined;

    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('El archivo debe ser una imagen');
      }
      photoUrl = await this.cloudinaryService.uploadItemPhoto({
        buffer: file.buffer,
      });
    }

    return this.itemsService.update(id, dto, userId, photoUrl);
  }

  // ─── Eliminar publicación (requiere auth + dueño) ────────────────────────────
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.itemsService.remove(id, userId);
  }
}
