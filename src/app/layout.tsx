import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'EventIQ AI | Intelligent event management', description: 'Create, discover and manage exceptional events.', icons: { icon: '/eventiq-mark.png' } };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
