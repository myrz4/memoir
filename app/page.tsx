'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [slug, setSlug] = useState('')

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold">Memoir</h1>
          <p className="text-gray-400 text-lg">
            Capture memories from your special moments
          </p>

          <div className="pt-8 space-y-3">
            <div>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="Enter event name (e.g., my-wedding)"
                className="w-full p-3 rounded bg-gray-900 border border-gray-700 focus:border-white outline-none text-white placeholder-gray-500"
              />
            </div>
            <Link
              href={slug ? `/event/${slug}` : '#'}
              onClick={(e) => !slug && e.preventDefault()}
              className={`block w-full py-3 text-center rounded font-semibold transition ${
                slug
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Access Event
            </Link>
          </div>

          <p className="text-sm text-gray-500 pt-8">
            Share this page link with guests to let them leave memories
          </p>
        </div>
      </div>
    </main>
  )
}