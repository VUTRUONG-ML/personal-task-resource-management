import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { JwtPayload } from '../common/interface/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';
@Injectable()
export class TokensService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

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

  async verifyToken(
    token: string,
    secretType: 'ACCESS' | 'REFRESH',
  ): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get(`JWT_${secretType}_SECRET`),
      });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        // 401 - Token expired, Client nên thực hiện Refresh Token flow
        throw new UnauthorizedException({
          errorCode: `${secretType}_TOKEN_EXPIRED`,
          message: 'Access token has expired',
        });
      }

      if (error instanceof JsonWebTokenError) {
        // 401 - Token bị sai, giả mạo hoặc không hợp lệ
        throw new UnauthorizedException({
          errorCode: `INVALID_${secretType}_TOKEN`,
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

  async saveRefreshToken(
    userId: number,
    rt: string,
    deviceId?: string | null,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx || this.prisma;
    const hashedToken = this.hashToken(rt);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày

    return db.refreshToken.create({
      data: {
        userId,
        token: hashedToken,
        deviceId, // Có thể undefined, DB sẽ lưu null (nếu schema cho phép)
        expiresAt,
      },
    });
  }

  async refreshAuthTokens(rt: string) {
    // 1. FAIL-FAST: Kiểm tra tính hợp lệ của JWT
    const payload = await this.verifyToken(rt, 'REFRESH');

    // 2. Băm token JWT dài thành chuỗi SHA-256 ngắn gọn
    const hashedToken = this.hashToken(rt);

    // 3. Đảm bảo tính toàn vẹn dữ liệu bằng Transaction
    return await this.prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.refreshToken.findUnique({
        where: { token: hashedToken },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException({ errorCode: 'INVALID_REFRESH_TOKEN' });
      }

      // Xử lý bảo mật: Phát hiện đánh cắp (Token Reuse)
      if (tokenRecord.isRevoked) {
        // Có người đang dùng lại một token đã bị thu hồi
        await tx.refreshToken.updateMany({
          where: { userId: payload.sub, isRevoked: false },
          data: { isRevoked: true },
        });
        throw new UnauthorizedException({
          errorCode: 'SECURITY_BREACH',
          message: 'Phát hiện truy cập bất thường. Yêu cầu đăng nhập lại.',
        });
      }

      // 4. Thu hồi token hiện tại
      await tx.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true },
      });

      // 5. Cấp lại cặp Token mới
      const newTokens = await this.generateAuthTokens({
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
      });

      // 6. Lưu mã băm của Refresh Token mới vào DB
      await this.saveRefreshToken(
        tokenRecord.user.id,
        newTokens.refreshToken,
        tokenRecord.deviceId,
        tx,
      );

      return newTokens;
    });
  }
}
