'use client'

import { useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import Link from 'next/link'

export default function AdminPage() {
  const [eventSlug, setEventSlug] = useState('')
  const [event, setEvent] = useState<any>(null)
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchEventMemories = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventSlug.trim()) return

    setLoading(true)
    setError('')
    setMemories([])
    setEvent(null)

    try {
      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', eventSlug)
        .single()

      if (eventError) {
        setError('Event not found')
        setLoading(false)
        return
      }

      setEvent(eventData)

      // Fetch memories for this event
      const { data: memoriesData, error: memoriesError } = await supabase
        .from('memories')
        .select('*')
        .eq('event_id', eventData.id)
        .order('created_at', { ascending: false })

      if (memoriesError) {
        console.error('Error fetching memories:', memoriesError)
        setError('Failed to load memories')
        setLoading(false)
        return
      }

      setMemories(memoriesData || [])
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="text-blue-400 hover:underline text-sm mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">View Event Memories</h1>
          <p className="text-gray-400">
            Enter an event slug to see all submitted memories
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={fetchEventMemories} className="mb-10 space-y-4 max-w-md">
          <div>
            <label className="text-sm text-gray-400">Event Slug</label>
            <input
              type="text"
              value={eventSlug}
              onChange={(e) => setEventSlug(e.target.value)}
              placeholder="e.g., demo-wedding"
              className="w-full mt-2 p-3 rounded bg-gray-900 border border-gray-700 focus:border-white outline-none text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !eventSlug.trim()}
            className="w-full px-6 py-3 bg-white text-black rounded font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '⏳ Loading...' : '🔍 Load Memories'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-8">
            {error}
          </div>
        )}

        {/* Event Info */}
        {event && (
          <div className="mb-8 p-6 bg-gray-900 rounded border border-gray-700">
            <h2 className="text-2xl font-bold">{event.name}</h2>
            <p className="text-gray-400 text-sm mt-1">
              Slug: <code className="bg-black px-2 py-1 rounded">{event.slug}</code>
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Created:{' '}
              {new Date(event.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-gray-300 font-semibold mt-3">
              Total Memories: {memories.length}
            </p>
          </div>
        )}

        {/* Memories Grid */}
        {memories.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-6">All Memories</h3>
            <div className="grid gap-6">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="border border-gray-700 rounded-lg p-6 bg-gray-900 hover:bg-gray-800 transition"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">
                        {memory.sender_name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(memory.created_at).toLocaleDateString(
                          undefined,
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs px-3 py-1 bg-gray-700 rounded">
                        {memory.media_type === 'none'
                          ? '📝 Text'
                          : memory.media_type === 'image'
                            ? '🖼️ Image'
                            : '🎥 Video'}
                      </span>
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-gray-200 mb-4 whitespace-pre-wrap break-words leading-relaxed">
                    {memory.message}
                  </p>

                  {/* Media */}
                  {memory.media_type === 'image' && memory.media_url && (
                    <div className="mb-4">
                      <img
                        src={memory.media_url}
                        alt="Memory"
                        className="w-full rounded max-h-96 object-cover"
                      />
                    </div>
                  )}

                  {memory.media_type === 'video' && memory.media_url && (
                    <div className="mb-4">
                      <video
                        controls
                        className="w-full rounded max-h-96"
                        src={memory.media_url}
                      />
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="pt-4 border-t border-gray-700 text-xs text-gray-500">
                    <p>ID: {memory.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {event && memories.length === 0 && !loading && (
          <div className="text-center py-16 bg-gray-900 rounded border border-gray-700">
            <p className="text-gray-400 text-lg">No memories yet for this event</p>
            <p className="text-gray-500 text-sm mt-2">
              Share the event link with guests to start collecting memories
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
