import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { LoggingInterceptor } from './interceptor/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true, // This allows the pipe to convert types based on TypeScript metadata
    },
  }))

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
  );
  // app.setGlobalPrefix('api');
  const config = new DocumentBuilder()
    .setTitle('Food Delivery API')
    .setDescription('API documentation for the Food Delivery System')
    .setVersion('1.0')
    .addTag('food-delivery')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const host = configService.get<string>('HOST', 'localhost');
  app.use(cookieParser());
  await app.listen(port, host);
}
bootstrap();
