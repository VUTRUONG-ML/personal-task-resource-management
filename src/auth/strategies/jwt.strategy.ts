import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../common/interface/jwt-payload.interface';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');

    if (!secret) {
      throw new UnauthorizedException('JWT_ACCESS_SECRET missing');
    }
    super({
      // 1. Chỉ ra nơi tìm Token (thường là trong Authorization header dưới dạng Bearer token)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 2. Không bỏ qua việc kiểm tra hạn sử dụng của Token
      ignoreExpiration: false,
      // 3. Lấy Secret Key từ biến môi trường (Bài học hôm qua)
      secretOrKey: secret,
    });
  }

  // 4. Hàm validate sẽ TỰ ĐỘNG chạy nếu Token hợp lệ
  // Dữ liệu 'payload' chính là những gì em đã nhét vào lúc signAsync
  validate(payload: JwtPayload) {
    // Bất cứ thứ gì em return ở đây sẽ được NestJS gán thẳng vào req.user
    // Trong các hệ thống lớn, ta thường chỉ trả về thông tin tối thiểu cần thiết
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
