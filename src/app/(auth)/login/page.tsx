import type { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LoginForm } from '@/features/authentication';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign into the production Next.js enterprise template demonstration portal.',
};

export default function LoginPage() {
  return (
    <Card variant="glass">
      <CardHeader style={{ textAlign: 'center' }}>
        <CardTitle style={{ fontSize: 'var(--font-size-2xl)' }}>Sign In to Portal</CardTitle>
        <CardDescription>
          Enter your enterprise credentials to access orders and system metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
