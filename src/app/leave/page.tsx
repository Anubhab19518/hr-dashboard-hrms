import { redirect } from 'next/navigation';

export default function LeaveRootPage() {
  redirect('/dashboard/leave');
}
