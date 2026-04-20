import { User } from '../entities/user.entity';

/**
 * Repository interface for User operations
 * Allows switching from Prisma to TypeORM or other implementations
 */
export interface UsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}
