import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { JwtPayload } from '../common/interface/jwt-payload.interface';

@Injectable()
export class TokensService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateAuthTokens(user: { id: number; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      // Access Token
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: '10m',
      }),
      // Refresh Token
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        // 401 - Token expired, Client nên thực hiện Refresh Token flow
        throw new UnauthorizedException({
          errorCode: 'TOKEN_EXPIRED',
          message: 'Access token has expired',
        });
      }

      if (error instanceof JsonWebTokenError) {
        // 401 - Token bị sai, giả mạo hoặc không hợp lệ
        throw new UnauthorizedException({
          errorCode: 'INVALID_TOKEN',
          message: 'Token signature is invalid',
        });
      }

      // Các lỗi hệ thống khác
      // thì bắn ra lỗi chung hoặc để NestJS tự handle
      throw new UnauthorizedException({
        errorCode: 'AUTH_FAILED',
        message: 'Authentication failed',
        statusCode: 401,
      });
    }
  }

  // Sau này sẽ viết thêm hàm saveRefreshToken(userId, token) ở đây
}
