"use client";

import { useState, useEffect } from "react";
import { useAuth0 } from '@auth0/auth0-react';
import { useEcho, useEchoClient } from '@merit-systems/echo-react-sdk';
import { Auth0Button } from '@/components/Auth0Button';
import { EchoSignIn } from '@/components/EchoSignIn';
import { FengShuiVisualization } from '@/components/FengShuiVisualization';
import { CircularProgress } from '@/components/CircularProgress';
import Embedded3DViewer from '@/components/Embedded3DViewer';

interface Tooltip {
  object_class: string;
  object_index: number;
  type: 'good' | 'bad' | 'neutral';
  message: string;
  coordinates: {
    bbox: any;
    center: any;
  };
  confidence: number;
}

interface AnalysisResult {
  score: number;
  overall_analysis: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  detected_objects: any[];
  tooltips: Tooltip[];
  model_3d: {
    model_id: string;
    status: string;
  };
}

export default function UploadPage() {
  const [fadeIn, setFadeIn] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auth0 integration
  const { isAuthenticated: isAuth0Authenticated, user: auth0User } = useAuth0();

  // Trigger fade-in on mount
  useEffect(() => {
    setFadeIn(true);
  }, []);

  // Handle auth modal fade-out when authenticated
  useEffect(() => {
    if (isAuth0Authenticated && authModalVisible) {
      setTimeout(() => {
        setAuthModalVisible(false);
      }, 500); // Small delay before fade-out
    }
  }, [isAuth0Authenticated, authModalVisible]);

  // Echo integration for payments
  const { isAuthenticated: isEchoAuthenticated } = useEcho();
  const echoClient = useEchoClient({
    apiUrl: 'https://echo.merit.systems'
  });
  const [requestCount, setRequestCount] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);

  // TESTING: Paywall toggle (disable for testing)
  const [paywallEnabled, setPaywallEnabled] = useState(() => {
    // Load from localStorage (persists across refreshes)
    const stored = localStorage.getItem('fengshui_paywall_enabled');
    return stored === null ? true : stored === 'true'; // Default: enabled
  });

  const FREE_REQUESTS = 3;

  // Save paywall preference
  useEffect(() => {
    localStorage.setItem('fengshui_paywall_enabled', paywallEnabled.toString());
  }, [paywallEnabled]);

  // Load request count from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('fengshui_request_count');
    if (stored) {
      setRequestCount(parseInt(stored, 10));
    }
  }, []);

  // Check balance if authenticated
  useEffect(() => {
    if (isEchoAuthenticated && echoClient) {
      echoClient.balance.get().then((bal) => {
        setBalance(bal.balance);
      }).catch(console.error);
    }
  }, [isEchoAuthenticated, echoClient]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResult(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    // TESTING: Skip paywall checks if disabled
    if (paywallEnabled) {
      // Check if user has free requests left (not signed in with Auth0)
      if (!isAuth0Authenticated && requestCount >= FREE_REQUESTS) {
        setShowPaymentPrompt(true);
        setError("You've used your 3 free analyses. Please sign in with Google to continue!");
        return;
      }

      // Check if authenticated user has balance (for Echo payments)
      if (isAuth0Authenticated && isEchoAuthenticated && balance !== null && balance <= 0) {
        setShowPaymentPrompt(true);
        setError("Insufficient balance. Please add credits to continue!");
        return;
      }
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("http://localhost:8000/analyze/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);

      // Increment request count and deduct balance (only if paywall enabled)
      if (paywallEnabled) {
        if (!isAuth0Authenticated) {
          // Not signed in - count free requests
          const newCount = requestCount + 1;
          setRequestCount(newCount);
          localStorage.setItem('fengshui_request_count', newCount.toString());
        } else if (isAuth0Authenticated && isEchoAuthenticated && echoClient) {
          // Signed in with both Auth0 and Echo - deduct from balance
          await echoClient.balance.deduct({ amount: 100 });
          // Refresh balance
          const bal = await echoClient.balance.get();
          setBalance(bal.balance);
        }
      }
      // If Auth0 authenticated but not Echo, treat as unlimited (or implement your logic)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!echoClient) return;
    try {
      // Create payment link for $5 (5000 credits at $0.01 per 100 credits = 50 analyses)
      const paymentLink = await echoClient.balance.createPaymentLink({
        amount: 5000,
        returnUrl: window.location.href
      });
      window.location.href = paymentLink.url;
    } catch (err) {
      setError("Failed to create payment link");
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <main className={`min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      {/* Mandatory Auth Modal */}
      {!isAuth0Authenticated && authModalVisible && (
        <div className={`fixed inset-0 bg-white z-50 flex items-center justify-center transition-opacity duration-1000 ${isAuth0Authenticated ? 'opacity-0' : 'opacity-100'}`}>
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-gray-100">
              {/* Logo or Icon */}
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-zen-sage to-zen-pine rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-serif font-light text-zen-pine mb-3 tracking-calm">
                Welcome
              </h2>

              {/* Description */}
              <p className="text-gray-600 font-light mb-8 leading-relaxed">
                Please sign in to begin your feng shui journey
              </p>

              {/* Auth Button */}
              <div className="flex justify-center">
                <Auth0Button />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header with Auth */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Feng Shui AI</h1>
              <p className="text-sm text-gray-500 mt-1">Powered by Auth0 + Echo</p>
            </div>
            <div className="flex items-center gap-3">
              <Auth0Button />
              {isAuth0Authenticated && <EchoSignIn />}
            </div>
          </div>

          {/* Testing Toggle */}
          <div className="mt-4 flex items-center justify-end gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <span className="text-xs font-medium text-yellow-800">
              🧪 TESTING MODE
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-yellow-700">
                Paywall {paywallEnabled ? 'ON' : 'OFF'}
              </span>
              <button
                onClick={() => setPaywallEnabled(!paywallEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  paywallEnabled ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    paywallEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
            <span className="text-xs text-yellow-600">
              {paywallEnabled ? '(Demo mode - paywall active)' : '(Testing - unlimited requests)'}
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Status Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {isAuth0Authenticated ? '🔐 Authenticated' : '🆓 Free Trial'}
                  </h3>
                  <p className="text-gray-600">
                    {isAuth0Authenticated
                      ? 'Unlimited analyses with Auth0'
                      : `${FREE_REQUESTS - requestCount} free analyses remaining`
                    }
                  </p>
                </div>
                {!isAuth0Authenticated && (
                  <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200">
                    Sign in for unlimited access
                  </div>
                )}
              </div>

              {/* Echo Payment Section - Always show for demo */}
              {isAuth0Authenticated && (
                <div className="border-t border-blue-200 pt-4 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      💳 Echo Monetization
                    </h4>
                    <p className="text-sm text-gray-600">
                      {isEchoAuthenticated && balance !== null
                        ? `Balance: ${Math.floor(balance / 100)} paid analyses`
                        : 'Optional: Purchase credits for premium features'}
                    </p>
                  </div>
                  <button
                    onClick={handleAddCredits}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors text-sm font-medium shadow-md"
                  >
                    💰 Add Credits ($5 = 50 analyses)
                  </button>
                </div>
              )}
            </div>
          </div>

          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            Feng Shui Analysis
          </h2>
          <p className="text-lg text-gray-600 mb-8 text-center">
            Upload a photo of your room to receive personalized feng shui insights
          </p>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            {/* Upload Section */}
            <div className="mb-8">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                {preview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-12 h-12 mb-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-400">PNG, JPG, JPEG (MAX. 10MB)</p>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  "Analyze Feng Shui"
                )}
              </button>
              {(selectedFile || result) && (
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300 disabled:opacity-50"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
                {showPaymentPrompt && !isAuth0Authenticated && (
                  <p className="text-gray-700 text-sm mt-2">
                    Sign in with Google to continue using Feng Shui AI!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Results Section */}
          {result && (
            <div className="space-y-6">
              {/* Score Card with Circular Progress */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  <CircularProgress score={result.score} size={220} strokeWidth={16} />
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Your Feng Shui Score
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                      {result.overall_analysis}
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Visualization with Tooltips - LARGER */}
              {result.tooltips && result.tooltips.length > 0 && preview && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    🔍 Interactive Analysis
                  </h3>
                  <p className="text-base text-gray-600 mb-6">
                    Hover over or click the info icons on the image to see specific feng shui insights for each object
                  </p>
                  <FengShuiVisualization
                    imageUrl={preview}
                    tooltips={result.tooltips}
                  />
                </div>
              )}


              {/* Strengths & Weaknesses */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">✓</span>
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {result.strengths.map((strength, idx) => (
                      <li key={idx} className="text-green-800 text-sm">
                        • {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">✗</span>
                    Weaknesses
                  </h3>
                  <ul className="space-y-2">
                    {result.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-red-800 text-sm">
                        • {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Suggestions */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">💡</span>
                  Improvement Suggestions
                </h3>
                <ul className="space-y-2">
                  {result.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-blue-800 text-sm">
                      {idx + 1}. {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3D Model Viewer - Embedded at bottom */}
              {result.model_3d && result.model_3d.model_id && (
                <Embedded3DViewer modelId={result.model_3d.model_id} />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
