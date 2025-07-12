// src/components/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null; // or a loading spinner
  }

  if (!session) {
    // Using the Redirect component with the correct route format
    return <Redirect href="/(auth)/welcome" />;
  }

  return <>{children}</>;
}