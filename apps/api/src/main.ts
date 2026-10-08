import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function bootstrap() {
  const logger = new Logger('EducaroCompassBootstrap');
  const app = await NestFactory.create(AppModule);

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Educaro Compass API')
    .setDescription(
      'Agentic AI Applicant Journey for Indian students, trainees, and professionals seeking study, Ausbildung, and skilled employment in Germany.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`============================================================`);
  logger.log(`  🧭 Educaro Compass API Server running on port ${port}   `);
  logger.log(`  🌐 Base API:      http://localhost:${port}/api/v1          `);
  logger.log(`  📚 Swagger Docs:  http://localhost:${port}/docs            `);
  logger.log(`  ⚡ Demo Mode:     ${process.env.DEMO_MODE || 'false'}      `);
  logger.log(`============================================================`);
}

bootstrap();
