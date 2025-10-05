"use client";

import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import Image from 'next/image';

export function Auth0Button() {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout, error } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        Error: {error.message}
      </div>
    );
  }

  if (isAuthenticated && user) {
    // Extract first name from user.name or use given_name
    const firstName = user.given_name || user.name?.split(' ')[0] || user.email?.split('@')[0] || 'User';

    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user.picture && (
            <Image
              src={user.picture}
              alt={firstName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full border-2 border-gray-200"
              unoptimized
            />
          )}
          <div className="text-sm text-gray-700">
            <span className="font-medium">Hi, </span>
            <span className="font-semibold">{firstName}!</span>
          </div>
        </div>
        <button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => loginWithRedirect({
        authorizationParams: {
          // Try without forcing Google connection first
          // connection: 'google-oauth2',
        }
      })}
      className="flex items-center gap-3 px-8 py-3 text-base font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
    >
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Sign in with Google
    </button>
  );
}
