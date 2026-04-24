import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryResponseDto } from './dto/category-response.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return categories.map((c) => new CategoryResponseDto(c));
  }

  async findBySlug(slug: string): Promise<CategoryResponseDto | null> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });
    return category ? new CategoryResponseDto(category) : null;
  }
}
