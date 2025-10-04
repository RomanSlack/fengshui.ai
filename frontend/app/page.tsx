export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zen-cloud via-zen-mist to-zen-blush">
      {/* Organic background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-zen-sage/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-zen-rose/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          {/* Logo/Icon placeholder */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zen-sage/20 mb-8">
            <svg className="w-10 h-10 text-zen-pine" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15" />
            </svg>
          </div>

          {/* Heading */}
          <div className="space-y-6">
            <h1 className="font-serif text-5xl md:text-7xl text-zen-pine tracking-calm font-light">
              FengShui.fy
            </h1>
            <p className="text-zen-earth text-lg md:text-xl font-light tracking-calm max-w-xl mx-auto leading-relaxed">
              Harmonious spaces, mindfully designed
            </p>
          </div>

          {/* CTA */}
          <div className="pt-8">
            <button className="group px-10 py-4 rounded-full bg-zen-sage/80 hover:bg-zen-sage text-zen-cloud transition-all duration-500 ease-out font-light tracking-calm">
              Begin Your Journey
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
            </button>
          </div>
        </div>

        {/* Subtle scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-zen-sage/30 to-transparent"></div>
        </div>
      </div>
    </main>
  );
}
