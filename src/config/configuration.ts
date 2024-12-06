import * as dotenv from 'dotenv';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';

const isProduction = NODE_ENV === 'production';

if (isProduction) {
  dotenv.config({ path: '.env.production.local', override: true });
}

const PORT = process.env.PORT || 4000;
const DOMAIN = process.env.DOMAIN || 'localhost';
const CLIENT_PORT = process.env.CLIENT_PORT || 3001;
const CLIENT_URI = process.env.CLIENT_URI || '';
const SERVER_URI = process.env.SERVER_URI || '';
const SAME_SITE = process.env.SAME_SITE || 'lax';
const MONGO_URI = process.env.MONGO_URI || '';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '';
const COOKIE_SECRET = process.env.COOKIE_SECRET || '';
const COOKIE_MAX_AGE = process.env.COOKIE_MAX_AGE || 86400;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const SESSION_SECRET = process.env.SESSION_SECRET || '';
const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRATION_TIME = process.env.JWT_EXPIRATION_TIME || 3599;
const RATE_LIMIT_MS = process.env.RATE_LIMIT_MS || 60000;
const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || 100;
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || '';

const CLIENT_URL = isProduction
  ? CLIENT_URI
  : `http://${DOMAIN}:${CLIENT_PORT}`;

const SERVER_URL = isProduction ? SERVER_URI : `http://${DOMAIN}:${PORT}`;

const HTTP_ONLY_COOKIE = {
  httpOnly: true,
  signed: true,
  sameSite: SAME_SITE,
  secure: isProduction,
  maxAge: Number(COOKIE_MAX_AGE) * 1000,
};

const USERS_COOKIE = {
  httpOnly: true,
  sameSite: SAME_SITE,
  secure: isProduction,
  maxAge: Number(COOKIE_MAX_AGE) * 1000,
};

export default () => ({
  NODE_ENV,
  PORT,
  DOMAIN,
  CLIENT_PORT,
  CLIENT_URI,
  SERVER_URI,
  MONGO_URI,
  ALLOWED_ORIGINS,
  COOKIE_SECRET,
  COOKIE_MAX_AGE,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  SESSION_SECRET,
  JWT_SECRET,
  JWT_EXPIRATION_TIME,
  RATE_LIMIT_MS,
  RATE_LIMIT_MAX,
  ENCRYPTION_SECRET,
  isProduction,
  CLIENT_URL,
  SERVER_URL,
  HTTP_ONLY_COOKIE,
  USERS_COOKIE,
});
