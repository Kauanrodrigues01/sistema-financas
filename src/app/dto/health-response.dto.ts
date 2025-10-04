import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: '2025-10-04T12:00:00.000Z' })
  timestamp: string;
}
