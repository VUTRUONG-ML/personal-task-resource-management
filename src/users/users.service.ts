import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    try {
      const { email, fullName, password, avatar, bio } = createUserDto;
      const profile = {
        fullName,
        avatar,
        bio,
      };
      return await this.prisma.user.create({
        data: {
          email,
          password,
          profile: {
            create: profile,
          },
        },
        include: { profile: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exist.');
        }
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.user.findMany({
      include: { profile: true },
      omit: {
        password: true,
        createdAt: true,
        role: true,
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: id },
      omit: { password: true, createdAt: true, role: true },
      include: {
        profile: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          profile: {
            upsert: {
              update: { ...updateUserDto },
              create: {
                fullName: updateUserDto.fullName ?? '',
                avatar: updateUserDto.avatar ?? '',
                bio: updateUserDto.bio ?? '',
              },
            },
          },
        },
        include: { profile: true },
        omit: { password: true, createdAt: true, role: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('User not found.');
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    return await this.prisma.user.delete({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user;
  }
}
