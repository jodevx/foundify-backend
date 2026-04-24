import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CategoriesModule } from '../categories/categories.module';
import { CloudinaryService } from '../../shared/storage/cloudinary.service';

@Module({
  imports: [PrismaModule, CategoriesModule],
  controllers: [ItemsController],
  providers: [ItemsService, CloudinaryService],
  exports: [ItemsService],
})
export class ItemsModule {}
