"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface TopNavProps {
  onNavigate?: () => void;
}

export function TopNav({ onNavigate }: TopNavProps = {}) {
  const router = useRouter();

  const handleNavigateHome = () => {
    if (onNavigate) {
      onNavigate(); // Trigger parent fade-out
    }
    setTimeout(() => {
      router.push("/");
    }, 600); // 600ms fade-out
  };

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
              FengShui.fy Demo
            </span>
          </button>

          {/* Right: Demo Badge */}
          <div className="px-4 py-2 text-sm font-light bg-zen-sage/10 text-zen-pine rounded-full border border-zen-sage/30">
            Demo Mode
          </div>
        </div>
      </div>
    </nav>
  );
}
