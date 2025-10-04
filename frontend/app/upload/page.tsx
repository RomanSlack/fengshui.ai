"use client";

import { useState, useEffect } from "react";
import { useEcho, useEchoClient } from '@merit-systems/echo-react-sdk';
import { EchoAuth } from '@/components/EchoAuth';

interface AnalysisResult {
  success: boolean;
  analysis: string;
  filename: string;
}

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Echo integration
  const { isAuthenticated, user } = useEcho();
  const echoClient = useEchoClient({
    apiUrl: 'https://echo.merit.systems'
  });
  const [requestCount, setRequestCount] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);

  const FREE_REQUESTS = 3;

  // Load request count from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('fengshui_request_count');
    if (stored) {
      setRequestCount(parseInt(stored, 10));
    }
  }, []);

  // Check balance if authenticated
  useEffect(() => {
    if (isAuthenticated && echoClient) {
      echoClient.balance.get().then((bal) => {
        setBalance(bal.balance);
      }).catch(console.error);
    }
  }, [isAuthenticated, echoClient]);

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

    // Check if user has free requests left
    if (!isAuthenticated && requestCount >= FREE_REQUESTS) {
      setShowPaymentPrompt(true);
      setError("You've used your 3 free analyses. Please sign in to continue!");
      return;
    }

    // Check if authenticated user has balance
    if (isAuthenticated && balance !== null && balance <= 0) {
      setShowPaymentPrompt(true);
      setError("Insufficient balance. Please add credits to continue!");
      return;
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
      setResult({
        success: true,
        analysis: data.result,
        filename: selectedFile.name
      });

      // Increment request count and deduct balance
      if (!isAuthenticated) {
        const newCount = requestCount + 1;
        setRequestCount(newCount);
        localStorage.setItem('fengshui_request_count', newCount.toString());
      } else if (echoClient) {
        // Deduct from Echo balance (you set the price, e.g., 100 = $0.01)
        await echoClient.balance.deduct({ amount: 100 });
        // Refresh balance
        const bal = await echoClient.balance.get();
        setBalance(bal.balance);
      }
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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Auth */}
        <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feng Shui AI</h1>
          </div>
          <EchoAuth />
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Status Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isAuthenticated ? 'Your Balance' : 'Free Trial'}
                </h3>
                <p className="text-gray-600">
                  {isAuthenticated
                    ? `${balance !== null ? Math.floor(balance / 100) : '...'} analyses remaining`
                    : `${FREE_REQUESTS - requestCount} free analyses remaining`
                  }
                </p>
              </div>
              {isAuthenticated && (
                <button
                  onClick={handleAddCredits}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Add Credits ($5 = 50 analyses)
                </button>
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
                {showPaymentPrompt && !isAuthenticated && (
                  <p className="text-gray-700 text-sm mt-2">
                    Sign in to get access to paid analyses and continue using Feng Shui AI!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Results Section */}
          {result && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Analysis Results
              </h2>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {result.analysis}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
