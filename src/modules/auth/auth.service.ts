import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { BcryptPasswordHasher } from '../../shared/crypto/bcrypt-password-hasher';
import { JwtTokenService } from './services/jwt-token.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { RegisterDto } from './dto/register.dto';
import { CloudinaryService } from '../../shared/storage/cloudinary.service';
import { UploadedFile } from '../../shared/storage/uploaded-file.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordHasher: BcryptPasswordHasher,
    private readonly tokenService: JwtTokenService,
    private readonly cloudinaryService: CloudinaryService,
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

  async register(
    registerDto: RegisterDto,
    profilePhoto?: UploadedFile,
  ): Promise<LoginResponseDto> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.passwordHasher.hash(registerDto.password);

    let profilePhotoUrl = registerDto.profilePhotoUrl;
    if (profilePhoto) {
      profilePhotoUrl = await this.cloudinaryService.uploadProfilePhoto(
        profilePhoto,
      );
    }

    const user = await this.usersService.createUserWithProfile({
      email: registerDto.email,
      passwordHash,
      firstName: registerDto.firstName,
      secondName: registerDto.secondName,
      firstLastName: registerDto.firstLastName,
      secondLastName: registerDto.secondLastName,
      gender: registerDto.gender,
      profilePhotoUrl,
    });

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
