import { Test, TestingModule } from '@nestjs/testing';
import { GoogleRoutesService } from './google-routes.service';

describe('GoogleRoutesService', () => {
  let service: GoogleRoutesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleRoutesService],
    }).compile();

    service = module.get<GoogleRoutesService>(GoogleRoutesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
