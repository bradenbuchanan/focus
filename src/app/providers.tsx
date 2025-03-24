// src/app/providers.tsx
'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { DataProvider } from '@/providers/DataProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </DataProvider>
    </AuthProvider>
  );
}
