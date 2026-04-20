import { User } from '../entities/user.entity';

export interface CreateUserWithProfileInput {
  email: string;
  passwordHash: string;
  firstName: string;
  secondName?: string;
  firstLastName: string;
  secondLastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  profilePhotoUrl?: string;
}

/**
 * Repository interface for User operations
 * Allows switching from Prisma to TypeORM or other implementations
 */
export interface UsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  createWithProfile(input: CreateUserWithProfileInput): Promise<User>;
}
