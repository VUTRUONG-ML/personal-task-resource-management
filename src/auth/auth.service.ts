import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
  ) {}
  async register(registerDto: CreateUserDto) {
    // 2. Hash mật khẩu (Security)
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      saltOrRounds,
    );
    const payload: CreateUserDto = {
      ...registerDto,
      password: hashedPassword,
    };
    // 3. Sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu
    // Tạo User
    const user = await this.userService.create(payload);

    // Trả về user (Omit password để bảo mật)
    const { password, ...result } = user;
    return result;
  }
}
