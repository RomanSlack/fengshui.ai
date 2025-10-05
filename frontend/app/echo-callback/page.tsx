"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEcho } from '@merit-systems/echo-react-sdk';

export default function EchoCallbackPage() {
  const router = useRouter();
  const { isLoggedIn: isEchoLoggedIn } = useEcho();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Wait for Echo SDK to process the OAuth callback
    // The SDK needs the URL params to exchange code for tokens
    // Once authenticated, clear params and redirect

    let attempts = 0;
    const maxAttempts = 30; // 15 seconds max wait (500ms * 30)

    const checkAuth = setInterval(() => {
      attempts++;

      // Check localStorage for Echo tokens as fallback
      const echoTokenKey = Object.keys(localStorage).find(key =>
        key.startsWith('oidc.user:https://echo.merit.systems')
      );
      const hasEchoTokens = !!echoTokenKey;
      const echoIsConnected = isEchoLoggedIn || hasEchoTokens;

      if (echoIsConnected) {
        // Echo is now authenticated! Clear params and redirect
        setHasChecked(true);
        clearInterval(checkAuth);

        // Clear URL params to prevent Auth0 from processing them
        window.history.replaceState({}, '', '/echo-callback');

        // Redirect to upload page after short delay
        setTimeout(() => {
          router.replace('/upload');
        }, 500);
      } else if (attempts >= maxAttempts) {
        // Timeout - redirect anyway
        console.warn('Echo authentication timed out, redirecting anyway');
        clearInterval(checkAuth);
        window.history.replaceState({}, '', '/echo-callback');
        router.replace('/upload');
      }
    }, 500);

    return () => clearInterval(checkAuth);
  }, [isEchoLoggedIn, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zen-cloud to-alabaster flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-zen-sage/20 border-t-zen-sage mx-auto"></div>
        <p className="text-lg font-light text-zen-pine">
          {hasChecked ? 'Connected! Redirecting...' : 'Connecting Echo...'}
        </p>
      </div>
    </div>
  );
}
