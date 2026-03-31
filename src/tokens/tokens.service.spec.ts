import { Test, TestingModule } from '@nestjs/testing';
import { TokensService } from './tokens.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('TokensService', () => {
  let service: TokensService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        {
          provide: JwtService,
          useValue: {
            // Giả lập hàm signAsync trả về token tùy theo input
            signAsync: jest.fn().mockResolvedValue('mock_token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            // Giả lập hàm get để lấy secret key từ .env
            get: jest.fn().mockReturnValue('fake_secret'),
          },
        },
      ],
    }).compile();

    service = module.get<TokensService>(TokensService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAuthTokens', () => {
    it('should return an object with accessToken and refreshToken', async () => {
      const signSpy = jest.spyOn(jwtService, 'signAsync');
      // 1. Dữ liệu đầu vào giả
      const payload = { id: 1, email: 'truong@test.com', role: 'USER' };

      // 2. Chạy hàm cần test
      const result = await service.generateAuthTokens(payload);

      // 3. Kiểm tra kết quả (Assertions)
      expect(result).toEqual({
        accessToken: 'mock_token',
        refreshToken: 'mock_token',
      });

      // 4. Kiểm tra xem JwtService có được gọi đúng 2 lần không (1 cho Access, 1 cho Refresh)
      expect(signSpy).toHaveBeenCalledTimes(2);
    });
  });
});
