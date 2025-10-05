"use client";

import { useState, useEffect } from "react";
import { TopNav } from '@/components/TopNav';
import { CircularProgress } from '@/components/CircularProgress';
import HybridViewer from '@/components/HybridViewer';
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
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMascotWelcome, setShowMascotWelcome] = useState(true);
  const [mascotFadingOut, setMascotFadingOut] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Trigger fade-in on mount
  useEffect(() => {
    setFadeIn(true);

    // Pre-load speech synthesis voices (needed for some browsers)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Listen for navigation events to trigger fade-out
  useEffect(() => {
    const handleBeforeUnload = () => {
      setFadeIn(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Clean up speech synthesis on unmount
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleUpload = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    // Track start time for minimum 5 second loading (realistic UX)
    const startTime = Date.now();

    try {
      // Load the static demo response
      const response = await fetch("/demo/response.json");

      if (!response.ok) {
        throw new Error(`Failed to load demo data: ${response.statusText}`);
      }

      const data = await response.json();

      // Calculate remaining time to reach minimum 5 seconds
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 5000 - elapsed);

      // Wait for remaining time before showing results (simulate processing)
      await new Promise(resolve => setTimeout(resolve, remainingTime));

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Refresh the page to restart demo
    window.location.reload();
  };

  const handleContinueFromMascot = () => {
    setMascotFadingOut(true);
    setTimeout(() => {
      setShowMascotWelcome(false);
      // Automatically load demo image
      setPreview("/demo/room.jpg");
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

  const handlePlayAudio = async () => {
    if (!result?.overall_analysis) return;

    // If already playing, stop the speech
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    try {
      setIsPlayingAudio(true);

      // Use Web Speech API for client-side TTS
      const utterance = new SpeechSynthesisUtterance(result.overall_analysis);

      // Configure voice settings for a calm, meditative tone
      utterance.rate = 0.9; // Slightly slower for zen effect
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Find a suitable voice (prefer female voices for calm tone)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice =>
        voice.name.includes('Samantha') ||
        voice.name.includes('Female') ||
        voice.lang.startsWith('en')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        setIsPlayingAudio(false);
      };

      utterance.onerror = () => {
        setIsPlayingAudio(false);
        setError("Failed to play audio");
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      setIsPlayingAudio(false);
      setError(err instanceof Error ? err.message : "Failed to generate audio");
    }
  };

  return (
    <main className={`min-h-screen bg-gradient-to-b from-zen-cloud to-alabaster transition-opacity duration-1000 ${isNavigating ? 'opacity-0' : fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      {/* Top Navigation */}
      <TopNav onNavigate={() => setIsNavigating(true)} />

      {/* Main Content - Linear Flow */}
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-serif font-light text-zen-pine tracking-calm">
            Feng Shui Analysis
          </h1>
          {!showMascotWelcome && (
            <p className="text-lg text-zen-earth font-light leading-relaxed max-w-2xl mx-auto">
              Upload a photo of your room to receive personalized feng shui insights and harmonize your space
            </p>
          )}
        </div>

        {/* Step 0: Mascot Welcome - Initial greeting */}
        {showMascotWelcome && !preview && !loading && !result && (
          <div className={`flex flex-col items-center space-y-8 transition-opacity duration-700 ease-out ${mascotFadingOut ? 'opacity-0' : 'opacity-100'}`}>
            {/* Speech Bubble */}
            <div className="relative max-w-xl mb-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-zen-sage/20">
                <p className="text-lg font-light text-zen-pine text-center leading-relaxed">
                  Welcome to the FengShui.fy demo! Click below to experience a sample feng shui analysis with interactive tooltips and a 3D room model. This is a demonstration of our full system using pre-loaded data.
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
              Try Demo
            </button>
          </div>
        )}


        {/* Step 2: Preview & Analyze - Show when file selected but not loading/complete */}
        {preview && !loading && !result && (
          <div className="transition-all duration-700 ease-out space-y-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg p-12 border border-gray-200">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-zen-sage to-zen-pine mb-4">
                  <span className="text-white text-2xl font-light">✓</span>
                </div>
                <h2 className="text-2xl font-serif font-light text-zen-pine tracking-calm">
                  Demo Room Ready
                </h2>
              </div>

              <div className="flex justify-center mb-8">
                <div className="relative rounded-2xl overflow-hidden shadow-xl max-h-96 inline-block">
                  <Image
                    src={preview}
                    alt="Preview"
                    width={800}
                    height={600}
                    className="max-h-96 w-auto object-contain"
                    unoptimized
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleUpload}
                  className="px-16 py-4 text-lg rounded-full bg-zen-sage/90 hover:bg-zen-sage text-white transition-all duration-500 ease-out shadow-2xl hover:shadow-3xl hover:scale-105 font-light tracking-calm"
                >
                  Analyze Energy Flow
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
                      <Image
                        src={preview}
                        alt="Analyzing"
                        width={800}
                        height={600}
                        className="max-h-96 w-auto object-contain"
                        unoptimized
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
                    className="object-contain drop-shadow-2xl w-auto h-auto"
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
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-serif font-light text-zen-pine tracking-calm">
                        Overall Analysis
                      </h3>
                      <button
                        onClick={handlePlayAudio}
                        className="ml-4 p-2 rounded-full bg-zen-sage/10 hover:bg-zen-sage/20 transition-all duration-300 group"
                        aria-label={isPlayingAudio ? "Stop audio" : "Play audio"}
                      >
                        {isPlayingAudio ? (
                          <svg
                            className="w-5 h-5 text-zen-sage"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-zen-sage group-hover:scale-110 transition-transform duration-300"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M11.553 3.064A.75.75 0 0112 3.75v16.5a.75.75 0 01-1.255.555L5.46 16H2.75A1.75 1.75 0 011 14.25v-4.5C1 8.784 1.784 8 2.75 8h2.71l5.285-4.805a.75.75 0 01.808-.13zM10.5 5.445l-4.245 3.86a.75.75 0 01-.505.195h-3a.25.25 0 00-.25.25v4.5c0 .138.112.25.25.25h3a.75.75 0 01.505.195l4.245 3.86V5.445z" />
                            <path d="M18.718 4.222a.75.75 0 011.06 0c4.296 4.296 4.296 11.26 0 15.556a.75.75 0 01-1.06-1.06 9.5 9.5 0 000-13.436.75.75 0 010-1.06z" />
                            <path d="M16.243 7.757a.75.75 0 10-1.061 1.061 4.5 4.5 0 010 6.364.75.75 0 001.06 1.06 6 6 0 000-8.485z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-zen-earth font-light leading-relaxed">
                      {result.overall_analysis}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hybrid 2D/3D Visualization */}
            {result.tooltips && result.tooltips.length > 0 && preview && (
              <HybridViewer
                imageUrl={preview}
                tooltips={result.tooltips}
                modelId={result.model_3d?.model_id || null}
                imageWidth={1170}
                imageHeight={1463}
              />
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
                  <li key={idx} className="text-gray-800 font-light leading-relaxed flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zen-sage/20 flex items-center justify-center text-zen-pine font-medium text-sm">
                      {idx + 1}
                    </span>
                    <span className="pt-1">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Restart Demo Button */}
            <div className="text-center pt-8">
              <button
                onClick={handleReset}
                className="px-16 py-4 text-lg rounded-full bg-white/80 hover:bg-white text-zen-pine border-2 border-zen-sage hover:border-zen-pine transition-all duration-500 font-light shadow-xl hover:scale-105 tracking-calm"
              >
                Restart Demo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Organic background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-zen-sage/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-zen-petal/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-zen-pine/5 rounded-full blur-2xl"></div>
      </div>
    </main>
  );
}
