import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

const MemoryStore = require('memorystore')(session);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const PORT = configService.get('PORT');
  const NODE_ENV = configService.get('NODE_ENV');
  console.log(NODE_ENV);
  const SESSION_SECRET = configService.get('SESSION_SECRET');
  const COOKIE_SECRET = configService.get('COOKIE_SECRET');
  const COOKIE_MAX_AGE = configService.get('COOKIE_MAX_AGE');
  const isDevelopment = configService.get('isDevelopment');
  const HTTP_ONLY_COOKIE = configService.get('HTTP_ONLY_COOKIE');
  const RATE_LIMIT_MS = configService.get('RATE_LIMIT_MS');
  const RATE_LIMIT_MAX = configService.get('RATE_LIMIT_MAX');
  const CLIENT_URL = configService.get('CLIENT_URL');
  const ALLOWED_ORIGINS = configService.get('ALLOWED_ORIGINS');
  const ALLOWED_ORIGIN = ALLOWED_ORIGINS
    ? (ALLOWED_ORIGINS?.includes?.(',') && ALLOWED_ORIGINS?.split?.(',')) ||
      ALLOWED_ORIGINS
    : undefined;
  const ORIGINS = [ALLOWED_ORIGIN, CLIENT_URL]
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
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: isDevelopment
        ? developmentContentSecurityPolicy
        : undefined,
    }),
  );
  app.enableCors({
    origin: [...new Set(ORIGINS)],
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
      proxy: !isDevelopment,
      store: new MemoryStore({
        checkPeriod: Number(COOKIE_MAX_AGE) * 1000,
      }),
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
