import { Module } from '@nestjs/common';
import { ClaimsController } from './claims.controller';
import { ClaimsInboxController } from './claims-inbox.controller';
import { ClaimsService } from './claims.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClaimsController, ClaimsInboxController],
  providers: [ClaimsService],
})
export class ClaimsModule {}
