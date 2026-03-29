import { Injectable, NotAcceptableException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  create(createUserDto: CreateUserDto) {
    const { email, fullName, password, avatar, bio } = createUserDto;
    const profile = {
      fullName,
      avatar,
      bio,
    };
    return this.prisma.user.create({
      data: {
        email,
        password,
        profile: {
          create: profile,
        },
      },
      include: { profile: true },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      omit: {
        password: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { password: true, createdAt: true },
    });
    if (!user) {
      throw new NotAcceptableException('user not found');
    }
    console.log('>>> ', user);
    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
