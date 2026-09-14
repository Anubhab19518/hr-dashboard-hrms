import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('Next.js Production Template'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

const parseClientEnv = () => {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_NAME: process.env['NEXT_PUBLIC_APP_NAME'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
  });

  if (!result.success) {
    const formattedErrors = JSON.stringify(result.error.format(), null, 2);
    throw new Error(`❌ Invalid client environment variables:\n${formattedErrors}`);
  }

  return result.data;
};

export const clientEnv = parseClientEnv();
export type ClientEnv = z.infer<typeof clientEnvSchema>;
