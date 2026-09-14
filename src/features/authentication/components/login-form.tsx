'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '../actions/login.action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setFieldErrors(undefined);
    setSuccessMessage(null);

    try {
      const response = await loginAction({ email, password });

      if (!response.success) {
        setErrorMessage(response.error);
        setFieldErrors(response.fieldErrors);
      } else {
        setSuccessMessage(`Welcome back, ${response.user.name}! Redirecting...`);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        width: '100%',
      }}
    >
      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-danger-bg))',
            border: '1px solid hsl(var(--color-danger) / 0.3)',
            color: 'hsl(var(--color-danger))',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-success-bg))',
            border: '1px solid hsl(var(--color-success) / 0.3)',
            color: 'hsl(var(--color-success))',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {successMessage}
        </div>
      )}

      <Input
        label="Email Address"
        type="email"
        id="login-email"
        name="email"
        placeholder="admin@example.com"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors?.['email']?.[0]}
        disabled={isLoading}
      />

      <Input
        label="Password"
        type="password"
        id="login-password"
        name="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors?.['password']?.[0]}
        disabled={isLoading}
      />

      <div style={{ marginTop: 'var(--space-2)' }}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          style={{ width: '100%' }}
        >
          Sign In
        </Button>
      </div>

      <div
        style={{
          marginTop: 'var(--space-2)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'hsl(var(--bg-secondary))',
          fontSize: 'var(--font-size-xs)',
          color: 'hsl(var(--text-muted))',
        }}
      >
        <p style={{ fontWeight: 600, color: 'hsl(var(--text-secondary))', marginBottom: '4px' }}>
          Demo Credentials:
        </p>
        <p>
          Email: <code>admin@example.com</code>
        </p>
        <p>
          Password: <code>Password123!</code>
        </p>
      </div>
    </form>
  );
}
