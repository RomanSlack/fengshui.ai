"use client";

import { Auth0Provider } from '@auth0/auth0-react';
import { EchoProvider } from '@merit-systems/echo-react-sdk';

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_ECHO_APP_ID || 'b52174f1-ce71-44e2-bf4e-e5e998db28d8';
  const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || 'dev-YOUR-DOMAIN.us.auth0.com';
  const auth0ClientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || 'ISDSR4eqmCeTQxkGEhuLHnTEdkjdmJRY';

  return (
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/upload` : 'http://localhost:3000/upload',
        scope: "openid profile email"
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <EchoProvider
        config={{
          appId,
          redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/upload` : 'http://localhost:3000/upload',
        }}
      >
        {children}
      </EchoProvider>
    </Auth0Provider>
  );
}
