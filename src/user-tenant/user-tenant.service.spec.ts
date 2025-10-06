import { Test, TestingModule } from '@nestjs/testing';
import { UserTenantService } from './user-tenant.service';

describe('UserTenantService', () => {
  let service: UserTenantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserTenantService],
    }).compile();

    service = module.get<UserTenantService>(UserTenantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
