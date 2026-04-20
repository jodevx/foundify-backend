/**
 * Interface for password hashing operations
 * Allows switching implementations (bcrypt, argon2, etc.)
 */
export interface PasswordHasher {
  /**
   * Hash a plain text password
   */
  hash(plainPassword: string): Promise<string>;

  /**
   * Compare a plain text password with a hash
   */
  compare(plainPassword: string, hash: string): Promise<boolean>;
}
