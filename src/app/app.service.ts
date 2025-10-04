import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class AppService {
  healthCheck(): HealthResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
