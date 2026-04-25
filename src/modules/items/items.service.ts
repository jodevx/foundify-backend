import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemFiltersDto } from './dto/item-filters.dto';
import { ItemResponseDto } from './dto/item-response.dto';
import {
  INITIAL_STATUS,
  VALID_STATUSES,
  ALLOWED_TRANSITIONS,
} from './enums/item-status.enum';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Crear publicación ──────────────────────────────────────────────────────

  async create(
    dto: CreateItemDto,
    userId: string,
    photoUrl?: string,
  ): Promise<ItemResponseDto> {
    // Validar que la categoría existe
    const category = await this.prisma.category.findUnique({
      where: { slug: dto.categorySlug },
    });
    if (!category) {
      throw new BadRequestException('La categoría no existe');
    }

    // Validar que la fecha no sea futura
    const eventDate = new Date(dto.eventDate);
    if (eventDate > new Date()) {
      throw new BadRequestException('La fecha del evento no puede ser futura');
    }

    // Validar que no sea mayor a 1 año atrás
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (eventDate < oneYearAgo) {
      throw new BadRequestException(
        'La fecha del evento no puede ser hace más de 1 año',
      );
    }

    const initialStatus = INITIAL_STATUS[dto.type];

    const item = await this.prisma.item.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type as any,
        categoryId: category.id,
        status: initialStatus,
        location: dto.location,
        eventDate: eventDate,
        color: dto.color ?? null,
        material: dto.material ?? null,
        brand: dto.brand ?? null,
          photoUrl: photoUrl ?? null,
        userId,
      },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                secondName: true,
                firstLastName: true,
                secondLastName: true,
              },
            },
          },
        },
      },
    });

    return new ItemResponseDto(item as any, userId);
  }

  // ─── Listar publicaciones ───────────────────────────────────────────────────

  async findAll(filters: ItemFiltersDto, requestingUserId?: string) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = { deleted: false };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      const slugs = filters.category.split(',').map((s) => s.trim());
      const categories = await this.prisma.category.findMany({
        where: { slug: { in: slugs } },
        select: { id: true },
      });
      where.categoryId = { in: categories.map((c) => c.id) };
    }

    if (filters.status) {
      const statuses = filters.status.split(',').map((s) => s.trim());
      where.status = { in: statuses };
    }

    if (filters.search) {
      const search = filters.search;
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  secondName: true,
                  firstLastName: true,
                  secondLastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.item.count({ where }),
    ]);

    const itemIds = items.map((item) => item.id);
    let pendingClaimsByItem = new Map<string, number>();

    if (itemIds.length > 0) {
      const pendingCounts = await this.prisma.claim.groupBy({
        by: ['itemId'],
        where: {
          itemId: { in: itemIds },
          status: 'pendiente',
        },
        _count: { _all: true },
      });

      pendingClaimsByItem = new Map(
        pendingCounts.map((entry) => [entry.itemId, entry._count._all]),
      );
    }

    return {
      data: items.map(
        (i) =>
          new ItemResponseDto(
            i as any,
            requestingUserId,
            pendingClaimsByItem.get(i.id) ?? 0,
          ),
      ),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Ver detalle ────────────────────────────────────────────────────────────

  async findOne(id: string, requestingUserId?: string): Promise<ItemResponseDto> {
    const item = await this.prisma.item.findFirst({
      where: { id, deleted: false },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                secondName: true,
                firstLastName: true,
                secondLastName: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const pendingClaimsCount = await this.prisma.claim.count({
      where: { itemId: id, status: 'pendiente' },
    });

    return new ItemResponseDto(item as any, requestingUserId, pendingClaimsCount);
  }

  // ─── Editar publicación ─────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateItemDto,
    userId: string,
    photoUrl?: string,
  ): Promise<ItemResponseDto> {
    const item = await this.prisma.item.findFirst({
      where: { id, deleted: false },
    });

    if (!item) throw new NotFoundException('Publicación no encontrada');
    if (item.userId !== userId) {
      throw new ForbiddenException('No eres el dueño de esta publicación');
    }

    const initialStatus = INITIAL_STATUS[item.type as keyof typeof INITIAL_STATUS];
    const isNonInitialStatus = item.status !== initialStatus;
    const isTryingToEditContent =
      dto.title !== undefined ||
      dto.description !== undefined ||
      dto.categorySlug !== undefined ||
      dto.location !== undefined ||
      dto.eventDate !== undefined ||
      dto.color !== undefined ||
      dto.material !== undefined ||
      dto.brand !== undefined ||
      photoUrl !== undefined;

    if (isNonInitialStatus && isTryingToEditContent) {
      throw new UnprocessableEntityException(
        'No puedes editar una publicación que ya cambió de estado. Reábrela primero.',
      );
    }

    let categoryId: string | undefined;
    if (dto.categorySlug) {
      const category = await this.prisma.category.findUnique({
        where: { slug: dto.categorySlug },
      });
      if (!category) {
        throw new BadRequestException('La categoría no existe');
      }
      categoryId = category.id;
    }

    // Validar transición de status si se envía
    if (dto.status) {
      const validStatuses =
        VALID_STATUSES[item.type as keyof typeof VALID_STATUSES] as readonly string[];
      if (!validStatuses.includes(dto.status)) {
        throw new BadRequestException(
          `Status inválido para publicación de tipo "${item.type}"`,
        );
      }

      const allowedNext = ALLOWED_TRANSITIONS[item.status] ?? [];
      if (!allowedNext.includes(dto.status)) {
        throw new BadRequestException(
          `No se puede pasar de "${item.status}" a "${dto.status}"`,
        );
      }
    }

    // Validar fecha si se envía
    if (dto.eventDate) {
      const eventDate = new Date(dto.eventDate);
      if (eventDate > new Date()) {
        throw new BadRequestException('La fecha del evento no puede ser futura');
      }
    }

    const updated = await this.prisma.item.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.status && { status: dto.status }),
        ...(categoryId && { categoryId }),
        ...(dto.location && { location: dto.location }),
        ...(dto.eventDate && { eventDate: new Date(dto.eventDate) }),
        ...(dto.color !== undefined && { color: dto.color || null }),
        ...(dto.material !== undefined && { material: dto.material || null }),
        ...(dto.brand !== undefined && { brand: dto.brand || null }),
        ...(photoUrl !== undefined && { photoUrl }),
      },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                secondName: true,
                firstLastName: true,
                secondLastName: true,
              },
            },
          },
        },
      },
    });

    return new ItemResponseDto(updated as any, userId);
  }

  // ─── Eliminar publicación ───────────────────────────────────────────────────

  async remove(id: string, userId: string): Promise<{ message: string; id: string }> {
    const item = await this.prisma.item.findFirst({
      where: { id, deleted: false },
    });

    if (!item) throw new NotFoundException('Publicación no encontrada');
    if (item.userId !== userId) {
      throw new ForbiddenException('No eres el dueño de esta publicación');
    }

    await this.prisma.item.update({
      where: { id },
      data: { deleted: true },
    });

    return { message: 'Publicación eliminada', id };
  }

  // ─── Helpers internos ───────────────────────────────────────────────────────

  async findItemOrFail(id: string) {
    const item = await this.prisma.item.findFirst({
      where: { id, deleted: false },
    });
    if (!item) throw new NotFoundException('Publicación no encontrada');
    return item;
  }
}
