import 'server-only';
import { z } from 'zod';

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  AUTH_SECRET: z.string().min(16).default('development-fallback-secret-key-32-chars'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const parseServerEnv = () => {
  const result = serverEnvSchema.safeParse({
    NODE_ENV: process.env['NODE_ENV'],
    PORT: process.env['PORT'],
    AUTH_SECRET: process.env['AUTH_SECRET'],
    LOG_LEVEL: process.env['LOG_LEVEL'],
  });

  if (!result.success) {
    const formattedErrors = JSON.stringify(result.error.format(), null, 2);
    throw new Error(`❌ Invalid server environment variables:\n${formattedErrors}`);
  }

  return result.data;
};

export const serverEnv = parseServerEnv();
export type ServerEnv = z.infer<typeof serverEnvSchema>;
