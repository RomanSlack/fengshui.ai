"use client";

import { useEcho } from '@merit-systems/echo-react-sdk';

export function EchoSignIn() {
  const { isLoggedIn, user, signIn, signOut, isLoading } = useEcho();

  if (isLoading) {
    return (
      <div className="text-xs text-gray-500">Echo loading...</div>
    );
  }

  if (isLoggedIn && user) {
    return (
      <button
        onClick={() => signOut()}
        className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
      >
        Echo: Connected ✓
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="px-3 py-1 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded hover:from-purple-700 hover:to-blue-700 transition-colors"
    >
      Connect Echo
    </button>
  );
}
