import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() //các module khác dùng được PrismaService mà không cần import lại
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
