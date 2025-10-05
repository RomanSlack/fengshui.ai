"use client";

import { useEcho } from '@merit-systems/echo-react-sdk';

export function EchoAuth() {
  const { user, isLoggedIn, isLoading, signIn, signOut } = useEcho();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (isLoggedIn && user) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-700">
          Welcome, <span className="font-semibold">{user.email || user.id}</span>
        </div>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
    >
      Sign In with Echo
    </button>
  );
}
