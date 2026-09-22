import type { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LoginForm } from '@/features/authentication';

export const metadata: Metadata = {
  title: 'Sign In | HR Dashboard',
  description: 'Sign into the HR Dashboard management and employee portal.',
};

export default function LoginPage() {
  return (
    <Card variant="glass">
      <CardHeader style={{ textAlign: 'center' }}>
        <CardTitle style={{ fontSize: 'var(--font-size-2xl)' }}>HR Dashboard</CardTitle>
        <CardDescription>
          Sign in with your admin email or employee code to access the portal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
