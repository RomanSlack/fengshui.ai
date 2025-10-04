import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zen-cloud via-zen-mist to-zen-blush">
      {/* Organic background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-zen-sage/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-zen-rose/10 rounded-full blur-3xl"></div>
        {/* Pink accent element */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-zen-petal/20 rounded-full blur-2xl"></div>
      </div>

      {/* Main content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-56 h-56 md:w-80 md:h-80 bg-white rounded-full p-4 shadow-xl">
              <Image
                src="/FengShui.fy%20circle%20logo.png"
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
            <h1 className="font-serif text-5xl md:text-7xl text-zen-pine tracking-calm font-light">
              FengShui.fy
            </h1>
            <p className="text-zen-earth text-lg md:text-xl font-light tracking-calm max-w-xl mx-auto leading-relaxed">
              Harmonious spaces, mindfully designed
            </p>
          </div>

          {/* CTA */}
          <div className="pt-8">
            <button className="group px-10 py-4 rounded-full bg-zen-sage/80 hover:bg-zen-sage text-zen-cloud transition-all duration-500 ease-out font-light tracking-calm shadow-lg hover:shadow-xl">
              Begin Your Journey
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
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
