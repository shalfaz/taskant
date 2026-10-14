'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './ui/Card';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  if (loading) return <LoadingSpinner className="min-h-screen" />;
  if (!user) return <LoadingSpinner className="min-h-screen" />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    else if (!loading && !isAdmin) router.replace('/dashboard');
  }, [isAdmin, loading, router, user]);

  if (loading) return <LoadingSpinner className="min-h-screen" />;
  if (!user || !isAdmin) return <LoadingSpinner className="min-h-screen" />;
  return <>{children}</>;
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace(user.role === 'admin' ? '/admin' : '/dashboard');
  }, [router, user]);

  if (loading) return <LoadingSpinner className="min-h-screen" />;
  if (user) return <LoadingSpinner className="min-h-screen" />;
  return <>{children}</>;
}
