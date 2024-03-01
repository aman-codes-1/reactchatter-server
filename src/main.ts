import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? (process.env.ALLOWED_ORIGINS?.includes(',') &&
        process.env.ALLOWED_ORIGINS?.split(',')) ||
      process.env.ALLOWED_ORIGINS
    : undefined;
  const origins = [allowedOrigins, process.env.CLIENT_URI]
    .filter((origin) => origin)
    .flat(1);
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: [...new Set(origins)],
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders:
      'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe',
    credentials: true,
  });
  app.use(cookieParser());
  await app.listen(process.env.PORT, async () => {
    const logger = new Logger();
    const appUri = await app.getUrl();
    logger.log(`Server started at ${appUri}`);
    logger.log(`GraphQL URL ${`${appUri}/graphql`}`);
  });
}
bootstrap();
