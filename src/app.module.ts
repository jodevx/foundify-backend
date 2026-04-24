import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ItemsModule } from './modules/items/items.module';
import { ClaimsModule } from './modules/claims/claims.module';

@Module({
  imports: [
    // Configuration module - loads .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Global Prisma module
    PrismaModule,
    // Feature modules
    AuthModule,
    UsersModule,
    // MVP 2
    CategoriesModule,
    ItemsModule,
    ClaimsModule,
  ],
})
export class AppModule {}

