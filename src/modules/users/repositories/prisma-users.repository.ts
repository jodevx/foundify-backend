import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateUserWithProfileInput,
  UsersRepository,
} from './users.repository.interface';
import { User } from '../entities/user.entity';

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createWithProfile(input: CreateUserWithProfileInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        profile: {
          create: {
            firstName: input.firstName,
            secondName: input.secondName,
            firstLastName: input.firstLastName,
            secondLastName: input.secondLastName,
            gender: input.gender,
            profilePhotoUrl: input.profilePhotoUrl,
          },
        },
      },
    });
  }
}
