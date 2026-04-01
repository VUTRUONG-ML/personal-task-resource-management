import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    // 'info' chính là đối tượng chứa chi tiết lỗi từ thư viện jsonwebtoken bên dưới Passport
    // 1. Kiểm tra nếu lỗi là do Token hết hạn
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException({
        errorCode: 'ACCESS_TOKEN_EXPIRED',
        message: 'Access token has expired',
        statusCode: 401,
      });
    }

    // 2. Kiểm tra nếu lỗi là do Token sai chữ ký, bị chỉnh sửa hoặc định dạng hỏng
    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException({
        errorCode: 'INVALID_ACCESS_TOKEN',
        message: 'Invalid token signature or format',
        statusCode: 401,
      });
    }

    // 3. Xử lý các trường hợp không có user (ví dụ: Client không gửi lên header Authorization)
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException({
          errorCode: 'AUTH_FAILED',
          message: 'Authentication failed or token missing',
          statusCode: 401,
        })
      );
    }

    // Nếu mọi thứ đều ổn, trả về user để NestJS gắn nó vào req.user
    return user;
  }
}
