/**
 * Interface for token generation and validation
 * Allows switching from JWT to sessions, OIDC, etc.
 */
export interface TokenService {
  /**
   * Generate access token for a user
   */
  generateAccessToken(userId: string, email: string): Promise<string>;

  /**
   * Validate and decode a token
   */
  validateToken(token: string): Promise<any>;
}
