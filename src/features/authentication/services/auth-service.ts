import type { UserSession } from '@/lib/auth/rbac';
import type { LoginInput } from '../schemas/login.schema';
import { logger } from '@/lib/logger/logger';

const DEMO_USERS: Record<string, { hash: string; user: UserSession }> = {
  'admin@example.com': {
    hash: 'Password123!',
    user: {
      id: 'usr_admin_01',
      email: 'admin@example.com',
      name: 'Administrator',
      role: 'admin',
    },
  },
  'dev@example.com': {
    hash: 'Password123!',
    user: {
      id: 'usr_dev_02',
      email: 'dev@example.com',
      name: 'Software Engineer',
      role: 'manager',
    },
  },
};

export class AuthService {
  public static async authenticate(input: LoginInput): Promise<UserSession | null> {
    logger.info('Authenticating user', {
      email: input.email,
      operation: 'AuthService.authenticate',
    });

    const record = DEMO_USERS[input.email.toLowerCase()];
    if (!record) {
      logger.warn('Authentication failed: user not found', { email: input.email });
      return null;
    }

    // Direct constant-time string comparison demo for template
    if (record.hash !== input.password) {
      logger.warn('Authentication failed: invalid password', { email: input.email });
      return null;
    }

    logger.info('User successfully authenticated', {
      userId: record.user.id,
      role: record.user.role,
    });
    return record.user;
  }
}
