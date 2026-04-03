import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

import { UsersService } from '../users/users.service';
import type { AuthUser } from '../common/interface/auth-user.interface';
import { TokensService } from '../tokens/tokens.service';
import { Cookie } from 'src/common/decorators/cookie.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
    private readonly tokenService: TokensService,
  ) {}
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: AuthUser) {
    // Gõ user. là nó tự động xổ ra id, email, role cực kỳ sướng!
    const account = await this.userService.findOne(user.id);
    return account;
  }
  @Post('register')
  async register(@Body() registerDto: CreateUserDto) {
    const result = await this.authService.register(registerDto);
    return {
      message: 'Register success',
      data: result,
    };
  }
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-device-id') deviceId?: string,
  ) {
    const result = await this.authService.login(loginDto, deviceId);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true, // Trình duyệt giấu không cho JS đọc
      secure: process.env.NODE_ENV === 'production', // Nếu lên server (prod) thì bắt buộc chạy qua HTTPS
      sameSite: 'strict', // Chống tấn công CSRF, chỉ gửi cookie nếu request từ đúng domain của mình
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return {
      message: 'Login success.',
      data: result.userWithoutPass,
      accessToken: result.accessToken,
    };
  }

  @Post('refresh')
  async refresh(
    @Cookie('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    const tokens = await this.tokenService.refreshAuthTokens(refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true, // Trình duyệt giấu không cho JS đọc
      secure: process.env.NODE_ENV === 'production', // Nếu lên server (prod) thì bắt buộc chạy qua HTTPS
      sameSite: 'strict', // Chống tấn công CSRF, chỉ gửi cookie nếu request từ đúng domain của mình
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: tokens.accessToken };
  }
}
