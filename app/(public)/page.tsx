'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../client/src/contexts/AuthContext';
import { LoadingSpinner } from '../../client/src/components/ui/Card';

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) router.replace(user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login');
  }, [loading, router, user]);

  return <LoadingSpinner className="min-h-screen" />;
}
