// src/components/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null; // or a loading spinner
  }

  const router = useRouter();

  useEffect(() => {
    if (!session) {
      // @ts-ignore - expo-router types are not perfect
      router.replace('/auth/welcome');
    }
  }, [session, router]);

  if (!session) {
    return null; // or a loading indicator
  }

  return <>{children}</>;
}