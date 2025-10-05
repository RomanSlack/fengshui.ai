"use client";

import { useState, useEffect } from "react";
import { useAuth0 } from '@auth0/auth0-react';
import { useEcho, useEchoClient } from '@merit-systems/echo-react-sdk';
import { Auth0Button } from '@/components/Auth0Button';
import { TopNav } from '@/components/TopNav';
import { FengShuiVisualization } from '@/components/FengShuiVisualization';
import { CircularProgress } from '@/components/CircularProgress';
import Embedded3DViewer from '@/components/Embedded3DViewer';
import Image from 'next/image';

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
  const [isNavigating, setIsNavigating] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMascotWelcome, setShowMascotWelcome] = useState(false);
  const [mascotFadingOut, setMascotFadingOut] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFadingOut, setPaywallFadingOut] = useState(false);
  const [showEchoSuccess, setShowEchoSuccess] = useState(false);

  // Auth0 integration
  const { isAuthenticated: isAuth0Authenticated, user: auth0User, error: auth0Error } = useAuth0();

  // Echo integration for payments
  const { isAuthenticated: isEchoAuthenticated, signIn: echoSignIn, balance: echoBalance } = useEcho();
  const echoClient = useEchoClient({
    apiUrl: 'https://echo.merit.systems'
  });

  // Trigger fade-in on mount
  useEffect(() => {
    setFadeIn(true);
  }, []);

  // Check on mount if user should see paywall or welcome mascot
  useEffect(() => {
    const usedFreeAnalysis = localStorage.getItem('fengshui_used_free_analysis') === 'true';

    // Fallback: Check localStorage directly for Echo tokens (in case SDK hasn't initialized)
    const echoTokenKey = Object.keys(localStorage).find(key =>
      key.startsWith('oidc.user:https://echo.merit.systems')
    );
    const hasEchoTokens = !!echoTokenKey;

    // Use hook state OR localStorage fallback
    const echoIsConnected = isEchoAuthenticated || hasEchoTokens;

    if (usedFreeAnalysis && !echoIsConnected) {
      // User has used free analysis AND not Echo connected - show paywall
      setShowPaywall(true);
      setShowMascotWelcome(false);
    } else if (!usedFreeAnalysis) {
      // First time user - show welcome mascot
      setShowMascotWelcome(true);
      setShowPaywall(false);
    } else {
      // Used free analysis but Echo IS connected - don't show paywall
      setShowPaywall(false);
      setShowMascotWelcome(false);
    }
  }, [isEchoAuthenticated]);

  // Listen for navigation events to trigger fade-out
  useEffect(() => {
    const handleBeforeUnload = () => {
      setFadeIn(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Handle auth modal fade-out when authenticated
  useEffect(() => {
    if (isAuth0Authenticated && authModalVisible) {
      setTimeout(() => {
        setAuthModalVisible(false);
      }, 500);
    }
  }, [isAuth0Authenticated, authModalVisible]);

  // Auto-dismiss paywall when Echo connects and show success message
  useEffect(() => {
    if (isEchoAuthenticated && showPaywall) {
      // Fade out paywall
      setPaywallFadingOut(true);
      setTimeout(() => {
        setShowPaywall(false);
        setPaywallFadingOut(false);
      }, 700);

      // Show success toast
      setShowEchoSuccess(true);
      setTimeout(() => {
        setShowEchoSuccess(false);
      }, 4000);
    }
  }, [isEchoAuthenticated, showPaywall]);

  // Show success message when Echo connects (even if no paywall showing)
  useEffect(() => {
    const wasNotAuthenticated = sessionStorage.getItem('echo_was_connecting');
    if (isEchoAuthenticated && wasNotAuthenticated === 'true') {
      sessionStorage.removeItem('echo_was_connecting');
      setShowEchoSuccess(true);
      setTimeout(() => {
        setShowEchoSuccess(false);
      }, 4000);
    }
  }, [isEchoAuthenticated]);

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

    // Check if user needs to connect Echo (used free analysis and not connected)
    const usedFreeAnalysis = localStorage.getItem('fengshui_used_free_analysis') === 'true';

    // Fallback: Check localStorage for Echo tokens
    const echoTokenKey = Object.keys(localStorage).find(key =>
      key.startsWith('oidc.user:https://echo.merit.systems')
    );
    const hasEchoTokens = !!echoTokenKey;
    const echoIsConnected = isEchoAuthenticated || hasEchoTokens;

    if (usedFreeAnalysis && !echoIsConnected) {
      setError("Please connect Echo to continue analyzing");
      return;
    }

    // Check if Echo user has sufficient balance (need at least $1 USD)
    if (echoIsConnected && echoBalance?.balance !== undefined && echoBalance.balance < 1) {
      setError("Insufficient balance. Please add credits to continue!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Track start time for minimum 5 second loading
    const startTime = Date.now();

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

      // Calculate remaining time to reach minimum 5 seconds
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 5000 - elapsed);

      // Wait for remaining time before showing results
      await new Promise(resolve => setTimeout(resolve, remainingTime));

      setResult(data);

      // Mark free analysis as used (if not Echo authenticated)
      if (!echoIsConnected) {
        localStorage.setItem('fengshui_used_free_analysis', 'true');
      }

      // Deduct balance if Echo user (1 USD per analysis)
      if (echoIsConnected && echoClient && echoClient.balance) {
        await echoClient.balance.deduct({ amount: 1 });
        // Balance will auto-refresh from useEcho() hook
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Check if user has used free analysis and not connected to Echo
    const usedFreeAnalysis = localStorage.getItem('fengshui_used_free_analysis') === 'true';

    // Fallback: Check localStorage for Echo tokens
    const echoTokenKey = Object.keys(localStorage).find(key =>
      key.startsWith('oidc.user:https://echo.merit.systems')
    );
    const hasEchoTokens = !!echoTokenKey;
    const echoIsConnected = isEchoAuthenticated || hasEchoTokens;

    if (usedFreeAnalysis && !echoIsConnected) {
      // Show paywall screen
      setShowPaywall(true);
      setSelectedFile(null);
      setPreview(null);
      setResult(null);
      setError(null);
    } else {
      // Normal reset - go back to upload
      setSelectedFile(null);
      setPreview(null);
      setResult(null);
      setError(null);
    }
  };

  const handleConnectEcho = () => {
    if (echoSignIn) {
      // Mark that we're starting Echo auth flow
      sessionStorage.setItem('echo_was_connecting', 'true');
      echoSignIn();
    }
  };

  const handleContinueFromMascot = () => {
    setMascotFadingOut(true);
    setTimeout(() => {
      setShowMascotWelcome(false);
    }, 700); // Wait for fade-out animation to complete
  };

  const getMascotComment = (score: number): string => {
    if (score === 10) return "Absolutely perfect! Your space radiates pure harmony!";
    if (score === 9) return "Amazing energy flow - you've mastered feng shui!";
    if (score === 8) return "Wonderful balance! Your space feels truly harmonious.";
    if (score === 7) return "Great work! Just a few tweaks for perfection.";
    if (score === 6) return "You're on the right track! Let's enhance this energy.";
    if (score === 5) return "There's potential here - let's unlock it together!";
    if (score === 4) return "Don't worry, we can improve this with some changes!";
    if (score === 3) return "Your space needs attention, but I'm here to help!";
    if (score === 2) return "Let's work together to transform this energy!";
    return "Every space can be improved - let's start fresh!";
  };

  const getMascotImage = (score: number): string => {
    return score >= 7 ? "/victory_good_mascot.png" : "/mascot_pointing_1.png";
  };

  return (
    <main className={`min-h-screen bg-gradient-to-b from-zen-cloud to-alabaster transition-opacity duration-1000 ${isNavigating ? 'opacity-0' : fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      {/* Mandatory Auth Modal - Only show if not authenticated */}
      {!isAuth0Authenticated && authModalVisible && (
        <div className={`fixed inset-0 bg-white z-50 flex items-center justify-center transition-opacity duration-1000 ${isAuth0Authenticated ? 'opacity-0' : 'opacity-100'}`}>
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-gray-100">
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-zen-sage to-zen-pine rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              <h2 className="text-3xl font-serif font-light text-zen-pine mb-3 tracking-calm">
                Welcome
              </h2>

              <p className="text-gray-600 font-light mb-8 leading-relaxed">
                Please sign in to begin your feng shui journey
              </p>

              <div className="flex justify-center">
                <Auth0Button />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <TopNav onNavigate={() => setIsNavigating(true)} />

      {/* Main Content - Linear Flow */}
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-serif font-light text-zen-pine tracking-calm">
            Feng Shui Analysis
          </h1>
          {!showMascotWelcome && !showPaywall && (
            <p className="text-lg text-zen-earth font-light leading-relaxed max-w-2xl mx-auto">
              Upload a photo of your room to receive personalized feng shui insights and harmonize your space
            </p>
          )}
        </div>

        {/* Paywall Screen - After first free analysis */}
        {showPaywall && !preview && !loading && !result && (
          <div className={`flex flex-col items-center space-y-8 transition-opacity duration-700 ease-out ${paywallFadingOut ? 'opacity-0' : 'opacity-100'}`}>
            {/* Speech Bubble */}
            <div className="relative max-w-xl mb-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-zen-sage/20">
                <p className="text-lg font-light text-zen-pine text-center leading-relaxed">
                  You've used your 1 free analysis! Connect Echo to analyze as many spaces as you like and unlock unlimited feng shui insights.
                </p>
                {/* Speech bubble tail pointing down to mascot */}
                <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white/95"></div>
              </div>
            </div>

            {/* Mascot Image - Pondering */}
            <div className="relative">
              <Image
                src="/mascot_pondering.png"
                alt="Feng Shui Mascot"
                width={280}
                height={280}
                className="object-contain"
                priority
              />
            </div>

            {/* Connect Echo Button */}
            <button
              onClick={handleConnectEcho}
              className="px-16 py-4 text-lg rounded-full bg-gradient-to-br from-zen-sage to-zen-pine hover:shadow-3xl text-white transition-all duration-500 ease-out shadow-2xl hover:scale-105 font-light tracking-calm mt-4"
            >
              Connect Echo
            </button>
          </div>
        )}

        {/* Step 0: Mascot Welcome - Initial greeting */}
        {showMascotWelcome && !preview && !loading && !result && !showPaywall && (
          <div className={`flex flex-col items-center space-y-8 transition-opacity duration-700 ease-out ${mascotFadingOut ? 'opacity-0' : 'opacity-100'}`}>
            {/* Speech Bubble */}
            <div className="relative max-w-xl mb-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-zen-sage/20">
                <p className="text-lg font-light text-zen-pine text-center leading-relaxed">
                  Are you ready to improve your space? Just upload a single image of your room and wait for the magic to happen!
                </p>
                {/* Speech bubble tail pointing up to mascot */}
                <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white/95"></div>
              </div>
            </div>

            {/* Mascot Image */}
            <div className="relative">
              <Image
                src="/mascot_standing_iter_2.png"
                alt="Feng Shui Mascot"
                width={306}
                height={340}
                className="object-contain"
                priority
              />
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinueFromMascot}
              className="px-16 py-4 text-lg rounded-full bg-zen-sage/90 hover:bg-zen-sage text-white transition-all duration-500 ease-out shadow-2xl hover:shadow-3xl hover:scale-105 font-light tracking-calm mt-4"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 1: Upload Section - Only show when no file selected */}
        {!showMascotWelcome && !showPaywall && !preview && !loading && !result && (
          <div className="transition-all duration-700 ease-out">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg p-12 border border-gray-200">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-zen-sage to-zen-pine mb-4">
                  <span className="text-white text-2xl font-light">1</span>
                </div>
                <h2 className="text-2xl font-serif font-light text-zen-pine tracking-calm">
                  Choose Your Space
                </h2>
              </div>

              <label
                htmlFor="file-upload"
                className="block cursor-pointer group"
              >
                <div className="relative h-80 border-2 border-dashed border-zen-sage/40 rounded-2xl hover:border-zen-sage hover:bg-zen-sage/5 transition-all duration-500 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 mb-6 rounded-full bg-zen-sage/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <svg
                      className="w-10 h-10 text-zen-sage"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <p className="text-xl text-zen-pine font-light mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-zen-earth/70 font-light">
                    PNG, JPG, or JPEG (Max 10MB)
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </label>

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 text-sm font-light">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Preview & Analyze - Show when file selected but not loading/complete */}
        {preview && !loading && !result && (
          <div className="transition-all duration-700 ease-out space-y-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg p-12 border border-gray-200">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-zen-sage to-zen-pine mb-4">
                  <span className="text-white text-2xl font-light">2</span>
                </div>
                <h2 className="text-2xl font-serif font-light text-zen-pine tracking-calm">
                  Review Your Image
                </h2>
              </div>

              <div className="flex justify-center mb-8">
                <div className="relative rounded-2xl overflow-hidden shadow-xl max-h-96 inline-block">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-96 w-auto object-contain"
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleUpload}
                  className="px-16 py-4 text-lg rounded-full bg-zen-sage/90 hover:bg-zen-sage text-white transition-all duration-500 ease-out shadow-2xl hover:shadow-3xl hover:scale-105 font-light tracking-calm"
                >
                  Analyze Energy Flow
                </button>
                <button
                  onClick={handleReset}
                  className="px-8 py-4 text-lg rounded-full bg-white/80 hover:bg-white text-zen-earth border-2 border-gray-300 hover:border-zen-sage transition-all duration-500 font-light shadow-lg"
                >
                  Choose Different Image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Loading State - Scanning Animation */}
        {loading && preview && (
          <div className="transition-all duration-700 ease-out">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg p-12 border border-gray-200">
              <div className="text-center space-y-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-zen-sage to-zen-pine mb-4">
                  <span className="text-white text-2xl font-light">3</span>
                </div>

                <h2 className="text-2xl font-serif font-light text-zen-pine tracking-calm">
                  Analyzing Your Space
                </h2>

                {/* Scanning Animation with Image */}
                <div className="flex flex-col items-center space-y-8 py-8">
                  {/* Image with scanning grid overlay */}
                  <div className="flex justify-center">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl max-h-96 inline-block">
                      <img
                        src={preview}
                        alt="Analyzing"
                        className="max-h-96 w-auto object-contain"
                      />

                      {/* Wavy mesh grid overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Animated wavy grid mesh */}
                        <svg className="absolute inset-0 w-full h-full">
                          <defs>
                            <pattern id="wavy-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                              {/* Horizontal lines */}
                              <line x1="0" y1="0" x2="50" y2="0" stroke="#5c8a4a" strokeWidth="1" opacity="0.9" className="animate-wave-1" />
                              <line x1="0" y1="25" x2="50" y2="25" stroke="#5c8a4a" strokeWidth="1" opacity="0.9" className="animate-wave-2" />
                              <line x1="0" y1="50" x2="50" y2="50" stroke="#5c8a4a" strokeWidth="1" opacity="0.9" className="animate-wave-1" />
                              {/* Vertical lines */}
                              <line x1="0" y1="0" x2="0" y2="50" stroke="#5c8a4a" strokeWidth="1" opacity="0.9" className="animate-wave-2" />
                              <line x1="25" y1="0" x2="25" y2="50" stroke="#5c8a4a" strokeWidth="1" opacity="0.9" className="animate-wave-1" />
                              <line x1="50" y1="0" x2="50" y2="50" stroke="#5c8a4a" strokeWidth="1" opacity="0.9" className="animate-wave-2" />
                            </pattern>

                            {/* Filter for wavy distortion effect */}
                            <filter id="wave-distortion">
                              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" result="turbulence">
                                <animate attributeName="baseFrequency" dur="8s" values="0.02;0.05;0.02" repeatCount="indefinite"/>
                              </feTurbulence>
                              <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="5" xChannelSelector="R" yChannelSelector="G"/>
                            </filter>
                          </defs>

                          {/* Apply the wavy pattern with distortion */}
                          <rect width="100%" height="100%" fill="url(#wavy-grid)" filter="url(#wave-distortion)"/>

                          {/* Ripple effect circles */}
                          <circle className="animate-ripple-1" cx="30%" cy="40%" r="20" fill="none" stroke="#5c8a4a" strokeWidth="2" opacity="0.7"/>
                          <circle className="animate-ripple-2" cx="70%" cy="60%" r="20" fill="none" stroke="#5c8a4a" strokeWidth="2" opacity="0.7"/>
                          <circle className="animate-ripple-3" cx="50%" cy="50%" r="20" fill="none" stroke="#5c8a4a" strokeWidth="2" opacity="0.7"/>
                        </svg>

                        {/* Corner brackets for scanning frame */}
                        <div className="absolute top-4 left-4 w-12 h-12 border-t-3 border-l-3 border-zen-pine animate-pulse"></div>
                        <div className="absolute top-4 right-4 w-12 h-12 border-t-3 border-r-3 border-zen-pine animate-pulse"></div>
                        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-3 border-l-3 border-zen-pine animate-pulse"></div>
                        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-3 border-r-3 border-zen-pine animate-pulse"></div>

                        {/* Green tint overlay */}
                        <div className="absolute inset-0 bg-zen-sage/10"></div>
                      </div>
                    </div>
                  </div>

                  {/* Loading Steps */}
                  <div className="space-y-4 text-center">
                    <p className="text-zen-earth font-light text-lg animate-pulse">
                      Detecting objects and energy patterns...
                    </p>
                    <p className="text-zen-earth/70 font-light text-sm">
                      This may take a few moments as we analyze your space
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Results Section - Beautiful Display */}
        {result && !loading && (
          <div className="transition-all duration-700 ease-out space-y-12">

            {/* Score Overview */}
            <div className="relative">
              {/* Mascot with comment - floating on left side */}
              <div className="hidden lg:flex flex-col items-center space-y-4 absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-8">
                {/* Speech Bubble */}
                <div className="relative max-w-sm mb-2">
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-5 border border-zen-sage/20">
                    <p className="text-base font-light text-zen-pine text-center leading-relaxed">
                      {getMascotComment(result.score)}
                    </p>
                    {/* Speech bubble tail pointing down */}
                    <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white/95"></div>
                  </div>
                </div>

                {/* Mascot Image */}
                <div className="relative">
                  <Image
                    src={getMascotImage(result.score)}
                    alt="Feng Shui Mascot"
                    width={240}
                    height={240}
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>
              </div>

              {/* Score card container - unchanged */}
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg p-12 border border-gray-200">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-zen-sage to-zen-pine mb-4">
                    <span className="text-white text-2xl font-light">✓</span>
                  </div>
                  <h2 className="text-2xl font-serif font-light text-zen-pine tracking-calm mb-6">
                    Your Feng Shui Assessment
                  </h2>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                  <CircularProgress score={result.score} size={220} strokeWidth={16} />
                  <div className="flex-1 text-center md:text-left max-w-xl">
                    <h3 className="text-xl font-serif font-light text-zen-pine mb-4 tracking-calm">
                      Overall Analysis
                    </h3>
                    <p className="text-zen-earth font-light leading-relaxed">
                      {result.overall_analysis}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Visualization */}
            {result.tooltips && result.tooltips.length > 0 && preview && (
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg p-12 border border-gray-200">
                <div className="mb-8">
                  <h3 className="text-2xl font-serif font-light text-zen-pine mb-2 tracking-calm">
                    Interactive Energy Map
                  </h3>
                  <p className="text-zen-earth font-light">
                    Hover over the icons to explore specific insights about each element in your space
                  </p>
                </div>
                <FengShuiVisualization
                  imageUrl={preview}
                  tooltips={result.tooltips}
                />
              </div>
            )}

            {/* Strengths & Weaknesses Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Strengths */}
              <div className="bg-green-50/80 backdrop-blur-sm border-2 border-green-200 rounded-3xl p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-2xl">✓</span>
                  </div>
                  <h3 className="text-xl font-serif font-light text-green-900 tracking-calm">
                    Strengths
                  </h3>
                </div>
                <ul className="space-y-3">
                  {result.strengths.map((strength, idx) => (
                    <li key={idx} className="text-green-800 font-light leading-relaxed flex items-start gap-3">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-red-50/80 backdrop-blur-sm border-2 border-red-200 rounded-3xl p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-2xl">✗</span>
                  </div>
                  <h3 className="text-xl font-serif font-light text-red-900 tracking-calm">
                    Areas to Address
                  </h3>
                </div>
                <ul className="space-y-3">
                  {result.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-red-800 font-light leading-relaxed flex items-start gap-3">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-zen-sage/10 backdrop-blur-sm border-2 border-zen-sage/30 rounded-3xl p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-zen-sage flex items-center justify-center">
                  <span className="text-white text-2xl">💡</span>
                </div>
                <h3 className="text-xl font-serif font-light text-zen-pine tracking-calm">
                  Improvement Suggestions
                </h3>
              </div>
              <ul className="space-y-4">
                {result.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-zen-earth font-light leading-relaxed flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zen-sage/20 flex items-center justify-center text-zen-pine font-medium text-sm">
                      {idx + 1}
                    </span>
                    <span className="pt-1">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3D Model Viewer */}
            {result.model_3d && result.model_3d.model_id && (
              <Embedded3DViewer modelId={result.model_3d.model_id} />
            )}

            {/* New Analysis Button */}
            <div className="text-center pt-8">
              <button
                onClick={handleReset}
                className="px-16 py-4 text-lg rounded-full bg-white/80 hover:bg-white text-zen-pine border-2 border-zen-sage hover:border-zen-pine transition-all duration-500 font-light shadow-xl hover:scale-105 tracking-calm"
              >
                Analyze Another Space
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Echo Success Toast */}
      {showEchoSuccess && (
        <div className="fixed top-8 right-8 z-50 animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="bg-gradient-to-br from-zen-sage to-zen-pine text-white rounded-2xl shadow-2xl p-6 flex items-center gap-4 max-w-md">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-lg">Echo Connected!</p>
              <p className="text-sm text-white/90 font-light">You now have unlimited analyses. Balance: {echoBalance?.balance !== undefined ? `${Math.floor(echoBalance.balance / 100)} credits` : '...'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Organic background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-zen-sage/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-zen-petal/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-zen-pine/5 rounded-full blur-2xl"></div>
      </div>
    </main>
  );
}
