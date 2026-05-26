import { Test, TestingModule } from '@nestjs/testing';
import { MaillerService } from './mailler.service';

describe('MaillerService', () => {
  let service: MaillerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaillerService],
    }).compile();

    service = module.get<MaillerService>(MaillerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
