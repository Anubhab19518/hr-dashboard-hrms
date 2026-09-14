import 'server-only';
import { serverEnv } from '@/lib/env/server';

/**
 * Access server-only secrets safely behind a verified server boundary.
 */
export function getAuthSecret(): string {
  return serverEnv.AUTH_SECRET;
}

export function getDatabaseUrl(): string {
  return serverEnv.DATABASE_URL;
}
