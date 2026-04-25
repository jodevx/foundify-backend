import { Controller, Get, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { ClaimsService } from './claims.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('claims')
export class ClaimsInboxController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get('inbox')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getInbox(@Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.claimsService.getInbox(userId);
  }
}
