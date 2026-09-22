import { redirect } from 'next/navigation';

/**
 * Marketing/landing page — redirects to login for the HR Dashboard.
 * This is an internal application, not a public marketing site.
 */
export default function HomePage() {
  redirect('/login');
}
