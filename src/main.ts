import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const PORT = configService.get('PORT');
  const ALLOWED_ORIGINS = configService.get('ALLOWED_ORIGINS');
  const CLIENT_URL = configService.get('CLIENT_URL');
  const SESSION_SECRET = configService.get('SESSION_SECRET');
  const COOKIE_SECRET = configService.get('COOKIE_SECRET');
  const isDevelopment = configService.get('isDevelopment');
  const HTTP_ONLY_COOKIE = configService.get('HTTP_ONLY_COOKIE');
  const RATE_LIMIT_MS = configService.get('RATE_LIMIT_MS');
  const RATE_LIMIT_MAX = configService.get('RATE_LIMIT_MAX');
  const origins = [ALLOWED_ORIGINS, CLIENT_URL]
    .filter((origin) => origin)
    .flat(1);
  const developmentContentSecurityPolicy = {
    directives: {
      imgSrc: [
        `'self'`,
        'data:',
        'apollo-server-landing-page.cdn.apollographql.com',
      ],
      scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      manifestSrc: [
        `'self'`,
        'apollo-server-landing-page.cdn.apollographql.com',
      ],
      frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
    },
  };
  app.use(
    helmet({
      contentSecurityPolicy: isDevelopment
        ? developmentContentSecurityPolicy
        : undefined,
    }),
  );
  app.enableCors({
    origin: [...new Set(origins)],
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders:
      'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      skipMissingProperties: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.use(cookieParser(COOKIE_SECRET));
  app.setGlobalPrefix('api');
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: HTTP_ONLY_COOKIE,
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(
    rateLimit({
      windowMs: Number(RATE_LIMIT_MS),
      max: Number(RATE_LIMIT_MAX),
    }),
  );
  await app.listen(PORT, async () => {
    const logger = new Logger();
    const appUri = await app.getUrl();
    logger.log(`Server started at ${appUri}`);
    logger.log(`GraphQL URL ${`${appUri}/graphql`}`);
  });
}

bootstrap();
