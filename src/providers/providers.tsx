//src/providers/providers.tsx
'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/providers/ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthProvider>
  );
}
