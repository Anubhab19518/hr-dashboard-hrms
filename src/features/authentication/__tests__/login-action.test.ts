import { describe, it, expect } from 'vitest';
import { loginAction } from '../actions/login.action';

describe('Login Server Action (AGENTS.md Rule 15)', () => {
  it('should authenticate valid credentials successfully', async () => {
    const result = await loginAction({
      email: 'admin@example.com',
      password: 'Password123!',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user.email).toBe('admin@example.com');
      expect(result.user.role).toBe('admin');
    }
  });

  it('should return error for invalid credentials', async () => {
    const result = await loginAction({
      email: 'admin@example.com',
      password: 'WrongPassword!',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid email or password');
    }
  });

  it('should return validation errors for malformed input', async () => {
    const result = await loginAction({
      email: 'not-an-email',
      password: 'short',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.['email']).toBeDefined();
      expect(result.fieldErrors?.['password']).toBeDefined();
    }
  });
});
