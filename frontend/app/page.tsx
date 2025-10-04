export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Fengshui AI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mb-12">
            Welcome to Fengshui AI - Your intelligent companion for harmonious design
          </p>
          <div className="flex gap-4">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Get Started
            </button>
            <button className="px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
