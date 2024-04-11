import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: process.env.ALLOWED_CLIENTS
      ? (process.env.ALLOWED_CLIENTS?.includes(',') &&
          process.env.ALLOWED_CLIENTS?.split(',')) ||
        process.env.ALLOWED_CLIENTS
      : process.env.CLIENT_URI,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
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
