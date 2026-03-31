import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { TokensService } from '../tokens/tokens.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
    private readonly tokenService: TokensService,
  ) {}
  saltOrRounds = 10;
  async register(registerDto: CreateUserDto) {
    // 2. Hash mật khẩu (Security)

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      this.saltOrRounds,
    );
    const payload: CreateUserDto = {
      ...registerDto,
      password: hashedPassword,
    };
    // 3. Sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu
    const user = await this.userService.create(payload);

    // Trả về user (Omit password để bảo mật)
    const { password, ...result } = user;
    return result;
  }
  async login(loginDto: LoginDto) {
    // 1. tìm user tồn tại qua email
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) throw new UnauthorizedException('Email/password invalid.');
    // 2. xác thực mật khẩu
    const isMatch: boolean = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isMatch) throw new UnauthorizedException('Email/password invalid.');
    // 3. tạo acctoken
    const { accessToken, refreshToken } =
      await this.tokenService.generateAuthTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    // 4. nếu có refreshtoken thì lưu vào db
    const { password: _, ...userWithoutPass } = user;
    return { userWithoutPass, accessToken };
  }
}
