'use server';

import { loginSchema } from '../schemas/login.schema';
import { AuthService } from '../services/auth-service';
import type { AuthActionResult } from '../types/auth.types';
import { logger } from '@/lib/logger/logger';

export async function loginAction(formData: unknown): Promise<AuthActionResult> {
  const result = loginSchema.safeParse(formData);

  if (!result.success) {
    logger.warn('Login validation failed', { fieldErrors: result.error.flatten().fieldErrors });
    return {
      success: false,
      error: 'Invalid form submission',
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await AuthService.authenticate(result.data);

    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    logger.error('Unexpected error during login action', error);
    return {
      success: false,
      error: 'An internal error occurred. Please try again later.',
    };
  }
}
