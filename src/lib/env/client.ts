import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('HR Dashboard'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:3002/api/v1'),
  NEXT_PUBLIC_CARTO_BASEMAP_KEY: z.string().optional(),
  NEXT_PUBLIC_MAPPLS_MAP_KEY: z.string().optional(),
});

const parseClientEnv = () => {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_NAME: process.env['NEXT_PUBLIC_APP_NAME'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
    NEXT_PUBLIC_API_BASE_URL:
      process.env['NEXT_PUBLIC_API_BASE_URL'] || process.env['NEXT_PUBLIC_API_URL'],
    NEXT_PUBLIC_CARTO_BASEMAP_KEY:
      process.env['NEXT_PUBLIC_CARTO_BASEMAP_KEY'] ||
      process.env['NEXT_PUBLIC_CARTO_API_KEY'] ||
      process.env['CARTO_API_KEY'],
    NEXT_PUBLIC_MAPPLS_MAP_KEY: process.env['NEXT_PUBLIC_MAPPLS_MAP_KEY'],
  });

  if (!result.success) {
    const formattedErrors = JSON.stringify(result.error.format(), null, 2);
    throw new Error(`❌ Invalid client environment variables:\n${formattedErrors}`);
  }

  return result.data;
};

export const clientEnv = parseClientEnv();
export type ClientEnv = z.infer<typeof clientEnvSchema>;
