import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should render HTML welcome page', () => {
      const mockResponse = {
        type: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      appController.getRoot(mockResponse as any);

      expect(mockResponse.type).toHaveBeenCalledWith('text/html');
      expect(mockResponse.send).toHaveBeenCalled();
      const htmlContent = mockResponse.send.mock.calls[0][0];
      expect(htmlContent).toContain('Fantasy Baseball Scorer');
      expect(htmlContent).toContain('API Running');
    });
  });
});
