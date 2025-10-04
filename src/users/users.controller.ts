import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ApiErrorResponses } from 'src/common/swagger/decorators/api-error-responses.decorator';
import { ApiPaginatedResponse } from 'src/common/swagger/decorators/api-paginated-response.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar um novo usuário',
    description: 'Cria um novo usuário com as informações fornecidas',
  })
  @ApiCreatedResponse({
    description: 'Usuário criado com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'Dados do usuário inválidos ou erro de validação',
    conflict: 'Email já está em uso',
  })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os usuários',
    description: 'Retorna uma lista paginada de todos os usuários',
  })
  @ApiPaginatedResponse(UserResponseDto)
  @ApiErrorResponses({
    badRequest: 'Parâmetros de paginação inválidos',
  })
  findAll(
    @Query() paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<User>> {
    return this.usersService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar usuário por ID',
    description: 'Retorna um único usuário através do seu ID',
  })
  @ApiOkResponse({
    description: 'Usuário encontrado com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'ID do usuário inválido',
    notFound: 'Usuário não encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar um usuário',
    description: 'Atualiza um usuário existente com as informações fornecidas',
  })
  @ApiOkResponse({
    description: 'Usuário atualizado com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'Dados do usuário inválidos ou erro de validação',
    notFound: 'Usuário não encontrado',
    conflict: 'Email já está em uso',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletar um usuário',
    description: 'Deleta um usuário através do seu ID',
  })
  @ApiOkResponse({
    description: 'Usuário deletado com sucesso',
  })
  @ApiErrorResponses({
    badRequest: 'ID do usuário inválido',
    notFound: 'Usuário não encontrado',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usersService.remove(id);
  }
}
