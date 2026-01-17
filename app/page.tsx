'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-black/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">MEMOIR</h1>
          <Link
            href="/auth/login"
            className="px-4 py-2 rounded font-semibold hover:bg-gray-800 transition"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-6xl font-bold">Capture memories. Keep them forever.</h2>
          <p className="text-xl text-gray-300">
            Easily collect photos, videos, and messages from friends and family at your special moments.
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-4 bg-white text-black rounded-lg font-bold text-lg hover:bg-gray-200 transition transform hover:scale-105"
          >
            Create an Event
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-black/50 py-16 border-y border-gray-700">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-3xl font-bold mb-12 text-center">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: 1, text: 'Create event' },
              { num: 2, text: 'Share link / QR' },
              { num: 3, text: 'Guests upload memories' },
              { num: 4, text: 'Download or save to Drive' },
            ].map((item) => (
              <div key={item.num} className="text-center">
                <div className="text-4xl font-bold text-white mb-3">{item.num}</div>
                <p className="text-gray-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold">Made for weddings, graduations & moments</h3>
          <p className="text-gray-400">
            Perfect for collecting memories from any special occasion
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/80 border-t border-gray-700 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-400">
          <p>&copy; 2026 Memoir. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}