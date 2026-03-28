import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateUserDto } from 'src/dto/create-users.dto';

@Controller('users')
export class UsersController {
  @Get()
  findAll() {
    return [];
  }

  @Get(':id')
  findOne(@Param('id') userId: number) {
    return { userId };
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return {
      message: 'create success',
      email: createUserDto.email,
      password: createUserDto.password,
      role: createUserDto.role,
    };
  }
}
