import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { ManageClaimDto, ClaimAction } from './dto/manage-claim.dto';
import { ClaimResponseDto } from './dto/claim-response.dto';
import { CLOSED_STATUSES_FOUND_ITEM } from '../items/enums/item-status.enum';

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Enviar reclamo "Creo que es mío" ──────────────────────────────────────

  async create(
    itemId: string,
    dto: CreateClaimDto,
    claimantId: string,
  ): Promise<ClaimResponseDto> {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, deleted: false },
    });

    if (!item) {
      throw new NotFoundException('Publicación no encontrada');
    }

    // Solo se puede reclamar publicaciones de tipo "found_item"
    if (item.type !== 'found_item') {
      throw new UnprocessableEntityException(
        'Solo puedes reclamar publicaciones de objetos encontrados',
      );
    }

    // No puedes reclamar tu propia publicación
    if (item.userId === claimantId) {
      throw new ForbiddenException('No puedes reclamar tu propia publicación');
    }

    // La publicación no puede estar cerrada
    if (CLOSED_STATUSES_FOUND_ITEM.includes(item.status)) {
      throw new UnprocessableEntityException(
        'Esta publicación ya está cerrada y no acepta más reclamos',
      );
    }

    // Verificar si ya existe un reclamo activo de este usuario
    const existingClaim = await this.prisma.claim.findUnique({
      where: { itemId_claimantId: { itemId, claimantId } },
    });

    if (existingClaim && existingClaim.status === 'pendiente') {
      throw new ConflictException(
        'Ya tienes un reclamo activo en esta publicación',
      );
    }

    // Si había uno cancelado/rechazado anterior podría re-reclamar
    // pero por simplicidad MVP 2 se bloquea con unique constraint
    if (existingClaim) {
      throw new ConflictException(
        'Ya enviaste un reclamo anterior sobre esta publicación',
      );
    }

    // Crear el reclamo y actualizar status de la publicación a en_validacion
    const [claim] = await this.prisma.$transaction([
      this.prisma.claim.create({
        data: {
          itemId,
          claimantId,
          claimMessage: dto.claimMessage,
        },
        include: {
          claimant: { select: { id: true, email: true } },
        },
      }),
      this.prisma.item.update({
        where: { id: itemId },
        data: { status: 'en_validacion' },
      }),
    ]);

    return new ClaimResponseDto(claim as any);
  }

  // ─── Listar reclamos de una publicación (solo el dueño) ────────────────────

  async findByItem(
    itemId: string,
    requestingUserId: string,
  ): Promise<{ data: ClaimResponseDto[] }> {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, deleted: false },
    });

    if (!item) throw new NotFoundException('Publicación no encontrada');
    if (item.userId !== requestingUserId) {
      throw new ForbiddenException(
        'Solo el dueño de la publicación puede ver los reclamos',
      );
    }

    const claims = await this.prisma.claim.findMany({
      where: { itemId },
      orderBy: { createdAt: 'desc' },
      include: {
        claimant: { select: { id: true, email: true } },
      },
    });

    return { data: claims.map((c) => new ClaimResponseDto(c as any)) };
  }

  // ─── Gestionar reclamo: aceptar / rechazar (solo el dueño del item) ────────

  async manage(
    itemId: string,
    claimId: string,
    dto: ManageClaimDto,
    requestingUserId: string,
  ): Promise<ClaimResponseDto> {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, deleted: false },
    });

    if (!item) throw new NotFoundException('Publicación no encontrada');
    if (item.userId !== requestingUserId) {
      throw new ForbiddenException(
        'Solo el dueño de la publicación puede gestionar los reclamos',
      );
    }

    const claim = await this.prisma.claim.findFirst({
      where: { id: claimId, itemId },
    });

    if (!claim) throw new NotFoundException('Reclamo no encontrado');
    if (claim.status !== 'pendiente') {
      throw new BadRequestException('El reclamo ya fue gestionado');
    }

    if (dto.action === ClaimAction.aceptado) {
      // Aceptar: rechazar todos los demás pendientes + cerrar publicación
      const [updatedClaim] = await this.prisma.$transaction([
        this.prisma.claim.update({
          where: { id: claimId },
          data: { status: 'aceptado' },
          include: { claimant: { select: { id: true, email: true } } },
        }),
        this.prisma.claim.updateMany({
          where: { itemId, id: { not: claimId }, status: 'pendiente' },
          data: { status: 'rechazado' },
        }),
        this.prisma.item.update({
          where: { id: itemId },
          data: { status: 'devuelto_propietario' },
        }),
      ]);
      return new ClaimResponseDto(updatedClaim as any);
    } else {
      // Rechazar: verificar si quedan otros pendientes
      const updatedClaim = await this.prisma.claim.update({
        where: { id: claimId },
        data: { status: 'rechazado' },
        include: { claimant: { select: { id: true, email: true } } },
      });

      const remainingPending = await this.prisma.claim.count({
        where: { itemId, status: 'pendiente' },
      });

      // Si no quedan pendientes volver a en_resguardo
      if (remainingPending === 0) {
        await this.prisma.item.update({
          where: { id: itemId },
          data: { status: 'en_resguardo' },
        });
      }

      return new ClaimResponseDto(updatedClaim as any);
    }
  }

  // ─── Cancelar reclamo propio ────────────────────────────────────────────────

  async cancel(
    itemId: string,
    claimId: string,
    claimantId: string,
  ): Promise<{ message: string; id: string }> {
    const claim = await this.prisma.claim.findFirst({
      where: { id: claimId, itemId, claimantId },
    });

    if (!claim) throw new NotFoundException('Reclamo no encontrado');
    if (claim.status !== 'pendiente') {
      throw new BadRequestException(
        'Solo puedes cancelar reclamos en estado pendiente',
      );
    }

    await this.prisma.claim.update({
      where: { id: claimId },
      data: { status: 'cancelado' },
    });

    // Si no quedan pendientes, volver a en_resguardo
    const remainingPending = await this.prisma.claim.count({
      where: { itemId, status: 'pendiente' },
    });

    if (remainingPending === 0) {
      await this.prisma.item.update({
        where: { id: itemId },
        data: { status: 'en_resguardo' },
      });
    }

    return { message: 'Reclamo cancelado', id: claimId };
  }
}
