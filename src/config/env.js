import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET'];
required.forEach((key) => {
  if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
});

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
  admin: {
    name: process.env.ADMIN_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  },
};

if (env.nodeEnv === 'production' && (env.jwtSecret.length < 32 || env.jwtSecret.includes('change-this'))) {
  throw new Error('JWT_SECRET must be a random string of at least 32 characters in production.');
}
