import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
// import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const PORT = configService.get('PORT');
  const COOKIE_SECRET = configService.get('COOKIE_SECRET');
  const COOKIE_MAX_AGE = configService.get('COOKIE_MAX_AGE');
  const SESSION_SECRET = configService.get('SESSION_SECRET');
  const HTTP_ONLY_COOKIE = configService.get('HTTP_ONLY_COOKIE');
  const MONGO_URI = configService.get('MONGO_URI');
  // const RATE_LIMIT_MS = configService.get('RATE_LIMIT_MS');
  // const RATE_LIMIT_MAX = configService.get('RATE_LIMIT_MAX');
  const CLIENT_URL = configService.get('CLIENT_URL');
  const ALLOWED_ORIGINS = configService.get('ALLOWED_ORIGINS');
  const ALLOWED_ORIGIN = ALLOWED_ORIGINS
    ? (ALLOWED_ORIGINS?.includes?.(',') && ALLOWED_ORIGINS?.split?.(',')) ||
      ALLOWED_ORIGINS
    : undefined;
  const ORIGINS = [ALLOWED_ORIGIN, CLIENT_URL]
    .filter((origin) => origin)
    .flat(1);
  const isProduction = configService.get('isProduction');
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
  const helmetOptions = isProduction
    ? {}
    : { contentSecurityPolicy: developmentContentSecurityPolicy };
  app.use(helmet(helmetOptions));
  app.enableCors({
    origin: [...new Set(ORIGINS)],
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
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
  app.set('trust proxy', 1);
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        ...HTTP_ONLY_COOKIE,
        secure: false,
      },
      proxy: isProduction,
      store: new MongoStore({
        mongoUrl: MONGO_URI,
        collectionName: 'userSessions',
        dbName: 'ReactChatter',
        ttl: Number(COOKIE_MAX_AGE),
        autoRemove: 'native',
      }),
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
  // app.use(
  //   rateLimit({
  //     windowMs: Number(RATE_LIMIT_MS),
  //     max: Number(RATE_LIMIT_MAX),
  //   }),
  // );
  await app.listen(PORT, async () => {
    const logger = new Logger();
    const appUri = await app.getUrl();
    logger.log(`Server started at ${appUri}`);
    logger.log(`GraphQL URL ${`${appUri}/graphql`}`);
  });
}

bootstrap();
