import type { Metadata } from 'next';
import Dashboard from '@/components/Dashboard';

export const metadata: Metadata = { title: 'Organizer dashboard | EventIQ AI' };

export default function DashboardPage() {
  return <Dashboard/>;
}
