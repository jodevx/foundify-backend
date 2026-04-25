import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { ManageClaimDto, ClaimAction } from './dto/manage-claim.dto';
import { ClaimResponseDto } from './dto/claim-response.dto';
import { InboxClaimResponseDto } from './dto/inbox-claim-response.dto';
import {
  CLOSED_STATUSES_FOUND_ITEM,
  CLOSED_STATUSES_LOST_ITEM,
} from '../items/enums/item-status.enum';

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService) {}

  private claimNoun(itemType: string): 'aviso' | 'reclamo' {
    return itemType === 'lost_item' ? 'aviso' : 'reclamo';
  }

  private claimNounPlural(itemType: string): 'avisos' | 'reclamos' {
    return itemType === 'lost_item' ? 'avisos' : 'reclamos';
  }

  private claimVerb(itemType: string): 'avisar' | 'reclamar' {
    return itemType === 'lost_item' ? 'avisar' : 'reclamar';
  }

  // ─── Enviar aviso/reclamo sobre publicación ────────────────────────────────

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

    if (item.type !== 'found_item' && item.type !== 'lost_item') {
      throw new UnprocessableEntityException('Tipo de publicación no soportado');
    }

    const noun = this.claimNoun(item.type);
    const nounPlural = this.claimNounPlural(item.type);
    const verb = this.claimVerb(item.type);

    // No puedes enviar sobre tu propia publicación
    if (item.userId === claimantId) {
      throw new ForbiddenException(`No puedes ${verb} tu propia publicación`);
    }

    const closedStatuses =
      item.type === 'found_item'
        ? CLOSED_STATUSES_FOUND_ITEM
        : CLOSED_STATUSES_LOST_ITEM;

    if (closedStatuses.includes(item.status)) {
      throw new UnprocessableEntityException(
        `Esta publicación ya está cerrada y no acepta más ${nounPlural}`,
      );
    }

    // Verificar si ya existe uno activo (pendiente) de este usuario
    const existingPendingClaim = await this.prisma.claim.findFirst({
      where: { itemId, claimantId, status: 'pendiente' },
      select: { id: true },
    });

    if (existingPendingClaim) {
      throw new ConflictException(`Ya tienes un ${noun} activo en esta publicación`);
    }

    try {
      const claimCreate = this.prisma.claim.create({
        data: {
          itemId,
          claimantId,
          claimMessage: dto.claimMessage,
        },
        include: {
          claimant: { select: { id: true, email: true } },
        },
      });

      if (item.type === 'found_item') {
        const [claim] = await this.prisma.$transaction([
          claimCreate,
          this.prisma.item.update({
            where: { id: itemId },
            data: { status: 'en_validacion' },
          }),
        ]);

        return new ClaimResponseDto(claim as any);
      }

      const claim = await claimCreate;

      return new ClaimResponseDto(claim as any);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `No se pudo enviar el ${noun} porque ya existe un registro previo para esta publicación`,
        );
      }

      throw error;
    }
  }

  async getInbox(
    requestingUserId: string,
  ): Promise<{ data: InboxClaimResponseDto[] }> {
    const claims = await this.prisma.claim.findMany({
      where: {
        status: 'pendiente',
        item: {
          userId: requestingUserId,
          deleted: false,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        claimant: { select: { id: true, email: true } },
        item: { select: { id: true, title: true, type: true } },
      },
    });

    return { data: claims.map((claim) => new InboxClaimResponseDto(claim as any)) };
  }

  // ─── Listar avisos/reclamos de una publicación (solo el dueño) ─────────────

  async findByItem(
    itemId: string,
    requestingUserId: string,
  ): Promise<{ data: ClaimResponseDto[] }> {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, deleted: false },
    });

    if (!item) throw new NotFoundException('Publicación no encontrada');
    const nounPlural = this.claimNounPlural(item.type);
    if (item.userId !== requestingUserId) {
      throw new ForbiddenException(
        `Solo el dueño de la publicación puede ver los ${nounPlural}`,
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

  // ─── Gestionar aviso/reclamo: aceptar / rechazar (solo el dueño) ───────────

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
    const nounPlural = this.claimNounPlural(item.type);
    if (item.userId !== requestingUserId) {
      throw new ForbiddenException(
        `Solo el dueño de la publicación puede gestionar los ${nounPlural}`,
      );
    }

    const claim = await this.prisma.claim.findFirst({
      where: { id: claimId, itemId },
    });

    const noun = this.claimNoun(item.type);
    if (!claim) throw new NotFoundException(`${noun[0].toUpperCase()}${noun.slice(1)} no encontrado`);
    if (claim.status !== 'pendiente') {
      throw new BadRequestException(`El ${noun} ya fue gestionado`);
    }

    const acceptedStatus =
      item.type === 'found_item' ? 'devuelto_propietario' : 'recuperado';
    const initialStatus =
      item.type === 'found_item' ? 'reportado_encontrado' : 'reportado_perdido';

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
          data: { status: acceptedStatus },
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

      // Si no quedan pendientes volver al estado inicial
      if (remainingPending === 0) {
        await this.prisma.item.update({
          where: { id: itemId },
          data: { status: initialStatus },
        });
      }

      return new ClaimResponseDto(updatedClaim as any);
    }
  }

  // ─── Cancelar aviso/reclamo propio ──────────────────────────────────────────

  async cancel(
    itemId: string,
    claimId: string,
    claimantId: string,
  ): Promise<{ message: string; id: string }> {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, deleted: false },
      select: { type: true },
    });

    if (!item) throw new NotFoundException('Publicación no encontrada');

    const noun = this.claimNoun(item.type);
    const nounPlural = this.claimNounPlural(item.type);

    const claim = await this.prisma.claim.findFirst({
      where: { id: claimId, itemId, claimantId },
    });

    if (!claim) throw new NotFoundException(`${noun[0].toUpperCase()}${noun.slice(1)} no encontrado`);
    if (claim.status !== 'pendiente') {
      throw new BadRequestException(
        `Solo puedes cancelar ${nounPlural} en estado pendiente`,
      );
    }

    await this.prisma.claim.update({
      where: { id: claimId },
      data: { status: 'cancelado' },
    });

    const initialStatus =
      item.type === 'found_item' ? 'reportado_encontrado' : 'reportado_perdido';

    // Si no quedan pendientes, volver al estado inicial
    const remainingPending = await this.prisma.claim.count({
      where: { itemId, status: 'pendiente' },
    });

    if (remainingPending === 0) {
      await this.prisma.item.update({
        where: { id: itemId },
        data: { status: initialStatus },
      });
    }

    return { message: `${noun[0].toUpperCase()}${noun.slice(1)} cancelado`, id: claimId };
  }
}
