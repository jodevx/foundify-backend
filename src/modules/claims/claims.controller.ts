import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { ManageClaimDto } from './dto/manage-claim.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('items/:itemId/claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  // ─── Enviar aviso/reclamo sobre publicación ────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('itemId') itemId: string,
    @Body() dto: CreateClaimDto,
    @Req() req: Request,
  ) {
    const claimantId = (req.user as any).userId;
    return this.claimsService.create(itemId, dto, claimantId);
  }

  // ─── Listar avisos/reclamos (solo el dueño del item) ───────────────────────
  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findByItem(@Param('itemId') itemId: string, @Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.claimsService.findByItem(itemId, userId);
  }

  // ─── Gestionar aviso/reclamo: aceptar / rechazar ───────────────────────────
  @Patch(':claimId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async manage(
    @Param('itemId') itemId: string,
    @Param('claimId') claimId: string,
    @Body() dto: ManageClaimDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).userId;
    return this.claimsService.manage(itemId, claimId, dto, userId);
  }

  // ─── Cancelar aviso/reclamo propio ──────────────────────────────────────────
  @Delete(':claimId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('itemId') itemId: string,
    @Param('claimId') claimId: string,
    @Req() req: Request,
  ) {
    const claimantId = (req.user as any).userId;
    return this.claimsService.cancel(itemId, claimId, claimantId);
  }
}
