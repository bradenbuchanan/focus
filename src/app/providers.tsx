'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '../providers/ThemeProvider'; // Adjust path as needed

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
