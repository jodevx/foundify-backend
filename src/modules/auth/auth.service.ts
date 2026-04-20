import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { BcryptPasswordHasher } from '../../shared/crypto/bcrypt-password-hasher';
import { JwtTokenService } from './services/jwt-token.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordHasher: BcryptPasswordHasher,
    private readonly tokenService: JwtTokenService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    // Find user by email
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user) {
      // Generic error message for security
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await this.passwordHasher.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      // Generic error message for security
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const accessToken = await this.tokenService.generateAccessToken(
      user.id,
      user.email,
    );

    return new LoginResponseDto(accessToken);
  }

  async validateUser(userId: string): Promise<any> {
    return this.usersService.findById(userId);
  }

  logout(): LogoutResponseDto {
    return new LogoutResponseDto('Logout successful');
  }
}
