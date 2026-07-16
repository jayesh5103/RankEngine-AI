import dotenv from 'dotenv';
import { z } from 'zod';

// Load variables from .env file into process.env
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string({
    required_error: 'MONGODB_URI is required',
  }).url('MONGODB_URI must be a valid connection URL'),
  REDIS_URL: z.string({
    required_error: 'REDIS_URL is required',
  }).url('REDIS_URL must be a valid connection URL'),
  JWT_SECRET: z.string({
    required_error: 'JWT_SECRET is required',
  }).min(8, 'JWT_SECRET must be at least 8 characters long'),
  JWT_EXPIRY: z.string({
    required_error: 'JWT_EXPIRY is required',
  }),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment validation failed. Please check your configuration:');
    result.error.issues.forEach((issue) => {
      console.error(`   - [${issue.path.join('.')}]: ${issue.message}`);
    });
    process.exit(1);
  }

  return result.data;
};

export const config = parseEnv();
export type Config = typeof config;
export default config;
