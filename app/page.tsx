'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-700/30 bg-black/40 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">✨ MEMOIR</h1>
          <Link
            href="/auth/login"
            className="px-6 py-2 rounded-lg font-semibold hover:bg-gray-800/50 transition border border-gray-700/50"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center space-y-12">
        <div className="space-y-6">
          <h2 className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent leading-tight">
            Capture Every Special Moment
          </h2>
          <p className="text-2xl text-gray-300 max-w-2xl mx-auto">
            Collect photos, videos, and heartfelt messages from your loved ones. One beautiful collection. Forever.
          </p>
        </div>

        <div className="pt-6">
          <Link
            href="/auth/signup"
            className="inline-block px-10 py-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold text-xl hover:shadow-2xl hover:shadow-pink-500/50 transition transform hover:scale-105"
          >
            Start Creating
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-b from-slate-900/50 to-black/50 py-24 border-y border-gray-700/30">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-4xl font-bold mb-16 text-center">Simple 4 Steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: 1, icon: '✨', text: 'Create your event', desc: 'Set up in seconds' },
              { num: 2, icon: '🔗', text: 'Share the link', desc: 'Send link or QR code' },
              { num: 3, icon: '📸', text: 'Guests upload', desc: 'Photos, videos & messages' },
              { num: 4, icon: '📥', text: 'Download or share', desc: 'Get everything as ZIP' },
            ].map((item) => (
              <div key={item.num} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-700/50 rounded-2xl p-8 hover:border-gray-600 transition space-y-4">
                <div className="text-5xl">{item.icon}</div>
                <h4 className="text-lg font-bold">{item.text}</h4>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-3 gap-8">
          {[
            { emoji: '💍', title: 'Weddings', desc: 'Collect memories from your special day' },
            { emoji: '🎓', title: 'Graduations', desc: 'Celebrate achievements together' },
            { emoji: '🎉', title: 'Celebrations', desc: 'Perfect for any milestone or party' },
          ].map((use) => (
            <div key={use.title} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-700/50 rounded-2xl p-8 text-center space-y-4 hover:border-gray-600 transition">
              <div className="text-5xl">{use.emoji}</div>
              <h4 className="text-2xl font-bold">{use.title}</h4>
              <p className="text-gray-400">{use.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-pink-900/20 to-indigo-900/20 border border-pink-500/20 rounded-3xl my-24 max-w-7xl mx-auto px-6 py-16 text-center">
        <h3 className="text-3xl font-bold mb-4">Ready to start capturing memories?</h3>
        <p className="text-gray-300 mb-8">Free forever. No credit card required.</p>
        <Link
          href="/auth/signup"
          className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-pink-500/50 transition"
        >
          Create Event Now
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-black/80 border-t border-gray-700/30 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500">
          <p>&copy; 2026 Memoir. Capture moments, keep memories forever.</p>
        </div>
      </footer>
    </main>
  )
}