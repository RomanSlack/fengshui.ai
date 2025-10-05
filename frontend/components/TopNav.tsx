"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useEcho } from "@merit-systems/echo-react-sdk";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface TopNavProps {
  onNavigate?: () => void;
}

export function TopNav({ onNavigate }: TopNavProps = {}) {
  const router = useRouter();
  const { user, isAuthenticated, logout, error } = useAuth0();
  const {
    isAuthenticated: isEchoAuthenticated,
    balance: echoBalance,
    signIn: echoSignIn,
    createPaymentLink
  } = useEcho();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if Echo is connected (hook state OR localStorage fallback)
  const [echoIsConnected, setEchoIsConnected] = useState(false);

  useEffect(() => {
    // Fallback: Check localStorage for Echo tokens
    const echoTokenKey = Object.keys(localStorage).find(key =>
      key.startsWith('oidc.user:https://echo.merit.systems')
    );
    const hasEchoTokens = !!echoTokenKey;
    setEchoIsConnected(isEchoAuthenticated || hasEchoTokens);
  }, [isEchoAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  const handleAddCredits = async () => {
    if (!createPaymentLink) {
      console.error('Echo payment link creator not available');
      return;
    }

    try {
      // Create payment link for $1 (minimum amount, amounts are in USD)
      const successUrl = `${window.location.origin}/upload`;
      const paymentUrl = await createPaymentLink(1, 'FengShui.fy Credits', successUrl);

      // Redirect to payment page
      window.location.href = paymentUrl;
    } catch (err) {
      console.error("Failed to create payment link:", err);
    }
  };

  const handleNavigateHome = () => {
    if (onNavigate) {
      onNavigate(); // Trigger parent fade-out
    }
    setTimeout(() => {
      router.push("/");
    }, 600); // 600ms fade-out
  };

  // Extract first name
  const firstName = user?.given_name || user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  // Only show navbar if authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <button
            onClick={handleNavigateHome}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200"
          >
            <div className="w-10 h-10 bg-white rounded-full p-1 shadow-md ring-2 ring-zen-sage/20">
              <Image
                src="/fengshui_fy_logo_better.png"
                alt="FengShui.fy"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-serif text-xl font-light text-zen-pine tracking-calm hidden md:inline">
              FengShui.fy
            </span>
          </button>

          {/* Right: Echo + User Profile */}
          <div className="flex items-center gap-4">
            {/* Echo Connection */}
            {echoIsConnected ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-light text-gray-500">Balance</p>
                  <p className="text-sm font-medium text-zen-pine">
                    {echoBalance?.balance !== undefined ? `${Math.floor(echoBalance.balance / 100)} credits` : "..."}
                  </p>
                </div>
                <button
                  onClick={handleAddCredits}
                  className="px-4 py-2 text-sm font-light bg-gradient-to-br from-zen-sage to-zen-pine text-white rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Add Credits
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  sessionStorage.setItem('echo_was_connecting', 'true');
                  if (echoSignIn) {
                    echoSignIn();
                  }
                }}
                className="px-4 py-2 text-sm font-light border border-zen-sage/30 text-zen-pine rounded-full hover:bg-zen-sage/10 transition-all duration-300"
              >
                Connect Echo
              </button>
            )}

            {/* User Profile with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200"
              >
                {user?.picture && (
                  <img
                    src={user.picture}
                    alt={firstName}
                    className="w-10 h-10 rounded-full border-2 border-zen-sage/30 shadow-sm"
                  />
                )}
                <div className="text-left hidden md:block">
                  <p className="text-sm font-light text-gray-700">
                    Hi, <span className="font-medium text-zen-pine">{firstName}</span>
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-light text-gray-500">Signed in as</p>
                    <p className="text-sm font-medium text-zen-pine truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      logout({ logoutParams: { returnTo: window.location.origin } });
                    }}
                    className="w-full px-4 py-2 text-left text-sm font-light text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
