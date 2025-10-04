"use client";

import { EchoProvider } from '@merit-systems/echo-react-sdk';

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_ECHO_APP_ID || 'b52174f1-ce71-44e2-bf4e-e5e998db28d8';

  return (
    <EchoProvider
      config={{
        appId,
        redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/upload` : 'http://localhost:3000/upload',
      }}
    >
      {children}
    </EchoProvider>
  );
}
