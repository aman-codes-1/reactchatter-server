const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_PORT = process.env.CLIENT_PORT || 3001;
const CLIENT_DOMAIN = process.env.CLIENT_DOMAIN || 'localhost';
const SERVER_DOMAIN = process.env.SERVER_DOMAIN || 'localhost';
const CLIENT_URI = process.env.CLIENT_URI || '';
const SERVER_URI = process.env.SERVER_URI || '';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? (process.env.ALLOWED_ORIGINS?.includes(',') &&
      process.env.ALLOWED_ORIGINS?.split(',')) ||
    process.env.ALLOWED_ORIGINS
  : undefined;
const COOKIE_SECRET = process.env.COOKIE_SECRET || '';
const COOKIE_MAX_AGE = process.env.COOKIE_MAX_AGE || 86400;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const SESSION_SECRET = process.env.SESSION_SECRET || '';
const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRATION_TIME = process.env.JWT_EXPIRATION_TIME || 3599;
const RATE_LIMIT_MS = process.env.RATE_LIMIT_MS || 60000;
const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || 100;
const isDevelopment = NODE_ENV === 'development';

export default () => ({
  PORT,
  NODE_ENV,
  CLIENT_PORT,
  CLIENT_DOMAIN,
  SERVER_DOMAIN,
  CLIENT_URL: isDevelopment
    ? `http://${CLIENT_DOMAIN}:${CLIENT_PORT}`
    : `${CLIENT_URI}`,
  SERVER_URL: isDevelopment
    ? `http://${SERVER_DOMAIN}:${PORT}`
    : `${SERVER_URI}`,
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
  HTTP_ONLY_COOKIE: {
    httpOnly: true,
    signed: true,
    domain: CLIENT_DOMAIN,
    sameSite: isDevelopment ? 'lax' : 'none',
    secure: !isDevelopment,
    maxAge: Number(COOKIE_MAX_AGE) * 1000,
  },
  USERS_COOKIE: {
    httpOnly: true,
    domain: CLIENT_DOMAIN,
    sameSite: isDevelopment ? 'lax' : 'none',
    secure: !isDevelopment,
    maxAge: Number(COOKIE_MAX_AGE) * 1000,
  },
  isDevelopment,
});
