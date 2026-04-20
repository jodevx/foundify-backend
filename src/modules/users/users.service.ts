import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaUsersRepository } from './repositories/prisma-users.repository';
import { User } from './entities/user.entity';
import { CreateUserWithProfileInput } from './repositories/users.repository.interface';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: PrismaUsersRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async createUserWithProfile(input: CreateUserWithProfileInput): Promise<User> {
    return this.usersRepository.createWithProfile(input);
  }
}
