import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { validationMessages } from 'src/common/messages/validation-messages';
import { BcryptService } from 'src/services/bcrypt.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  private readonly userSelect = {
    id: true,
    email: true,
    name: true,
    isAdmin: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(
    private prisma: PrismaService,
    private bcryptService: BcryptService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    await this.checkEmailExists(createUserDto.email);

    const hashedPassword = await this.bcryptService.hashPassword(
      createUserDto.password,
    );

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: this.userSelect,
    });
  }

  async findAll(
    paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.userSelect,
      }),
      this.prisma.user.count(),
    ]);

    return {
      items: users,
      meta: {
        totalItems,
        itemCount: users.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException(validationMessages.USER.NOT_FOUND(id));
    }

    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    await this.findOne(id);

    if (updateUserDto.email) {
      await this.checkEmailExists(updateUserDto.email, id);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: this.userSelect,
    });
  }

  async remove(id: number): Promise<UserResponseDto> {
    await this.findOne(id);

    return this.prisma.user.delete({
      where: { id },
      select: this.userSelect,
    });
  }

  async updatePassword(
    id: number,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<UserResponseDto> {
    // Buscar usuário com password para validação
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(validationMessages.USER.NOT_FOUND(id));
    }

    // Validar se as novas senhas coincidem
    if (
      updatePasswordDto.newPassword !== updatePasswordDto.newPasswordConfirm
    ) {
      throw new BadRequestException('As senhas não coincidem');
    }

    // Validar senha atual
    const isPasswordValid = await this.bcryptService.comparePasswords(
      updatePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedPassword = await this.bcryptService.hashPassword(
      updatePasswordDto.newPassword,
    );

    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: this.userSelect,
    });
  }

  private async checkEmailExists(
    email: string,
    excludeId?: number,
  ): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== excludeId) {
      throw new ConflictException(validationMessages.EMAIL.ALREADY_IN_USE);
    }
  }
}
