import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { HealthResponseDto } from './dto/health-response.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Verifica o status de saúde da API' })
  @ApiResponse({ status: 200, type: HealthResponseDto })
  healthCheck(): HealthResponseDto {
    return this.appService.healthCheck();
  }
}
