import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

import { UsersService } from '../users/users.service';
import type { AuthUser } from '../common/interface/auth-user.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
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
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Login success.',
      data: result.userWithoutPass,
      accessToken: result.accessToken,
    };
  }
}
