'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Sidebar } from './Sidebar';
import { ToastProvider } from '@/components/ui/Toast';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 overflow-y-auto">{children}</main>
      </div>
    </ToastProvider>
  );
}
