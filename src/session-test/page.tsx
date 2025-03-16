// src/app/session-test/page.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function SessionTest() {
  const { data: session, status } = useSession();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Session Test</h1>
      <p>Status: {status}</p>
      <pre>{JSON.stringify(session, null, 2)}</pre>

      {!session ? (
        <button onClick={() => signIn()}>Sign in</button>
      ) : (
        <button onClick={() => signOut()}>Sign out</button>
      )}
    </div>
  );
}
