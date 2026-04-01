// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { Request } from 'express';
import { AuthUser } from './interface/auth-user.interface';
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    // 1. Lấy ra cái Request từ ExecutionContext
    const request = ctx.switchToHttp().getRequest<Request>();

    // 2. Lấy object user mà thằng Passport JwtStrategy đã nhét vào
    const user = request.user as AuthUser;

    // 3. Tính năng nâng cao:
    // Nếu gọi @CurrentUser('email') -> trả về mỗi email.
    // Nếu gọi @CurrentUser() -> trả về cả object user.
    return data ? user?.[data] : user;
  },
);
