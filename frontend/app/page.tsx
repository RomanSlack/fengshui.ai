"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const handleBeginJourney = () => {
    setIsNavigating(true);

    // Show loading spinner only if it takes more than 2 seconds
    const loadingTimeout = setTimeout(() => {
      setShowLoading(true);
    }, 2000);

    // Navigate after fade-out
    setTimeout(() => {
      clearTimeout(loadingTimeout);
      router.push("/upload");
    }, 1000);
  };

  if (showLoading) {
    return (
      <div className="fixed inset-0 bg-zen-cloud flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-zen-sage/20 border-t-zen-sage"></div>
      </div>
    );
  }

  return (
    <main className={`relative min-h-screen overflow-hidden transition-opacity duration-1000 ${isNavigating ? 'opacity-0' : 'opacity-100'}`}>
      {/* Full-screen background image - responsive and always covering */}
      <div className="fixed inset-0 w-full h-full -z-10">
        <Image
          src="/fengshui_background_logo.png"
          alt="Feng Shui Background"
          fill
          className="object-cover object-center animate-breathe"
          priority
          quality={100}
          sizes="100vw"
        />
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20"></div>
      </div>

      <style jsx>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        :global(.animate-breathe) {
          animation: breathe 20s ease-in-out infinite;
        }
      `}</style>

      {/* Organic background shapes - softened to blend with image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        {/* Pink accent element */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-zen-petal/10 rounded-full blur-2xl"></div>
      </div>

      {/* Main content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-56 h-56 md:w-80 md:h-80 bg-white/95 backdrop-blur-sm rounded-full p-4 shadow-2xl ring-4 ring-white/20">
              <Image
                src="/fengshui_fy_logo_better.png"
                alt="FengShui.fy Logo"
                width={420}
                height={420}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-6">
            <h1 className="font-serif text-6xl md:text-8xl text-zen-pine tracking-calm font-light drop-shadow-lg">
              FengShui.fy
            </h1>
            <div className="max-w-2xl mx-auto space-y-2">
              <p className="text-base md:text-lg text-zen-pine/90 font-light italic">
                (noun)
              </p>
              <p className="text-zen-pine/90 text-base md:text-lg font-light tracking-calm leading-relaxed">
                A timeless Chinese art of arranging spaces to harmonize energy flow (qi), promoting balance, well-being, and prosperity through thoughtful design and placement.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-8">
            <button
              onClick={handleBeginJourney}
              className="px-12 py-5 text-lg md:text-xl rounded-full bg-zen-sage/90 hover:bg-zen-sage text-white transition-all duration-500 ease-out font-light tracking-calm shadow-2xl hover:shadow-3xl hover:scale-105 backdrop-blur-sm"
            >
              Begin Your Journey
            </button>
          </div>
        </div>

        {/* Subtle scroll indicator with pink accent */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-zen-petal/50 to-transparent"></div>
        </div>
      </div>
    </main>
  );
}
