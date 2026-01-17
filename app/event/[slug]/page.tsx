'use client'

import { useParams } from 'next/navigation'
import { supabase } from '@/src/lib/supabase'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function EventPage() {
  const { slug } = useParams()

  const [event, setEvent] = useState<any>(null)
  const [memories, setMemories] = useState<any[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [showMemories, setShowMemories] = useState(false)

  // Fetch event and memories
  useEffect(() => {
    if (!slug) return

    const fetchData = async () => {
      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single()

      if (eventError) {
        setError('Event not found')
        return
      }

      setEvent(eventData)

      // Fetch memories
      const { data: memoriesData } = await supabase
        .from('memories')
        .select('*')
        .eq('event_id', eventData.id)
        .order('created_at', { ascending: false })

      setMemories(memoriesData || [])
    }

    fetchData()
  }, [slug])

  const submitMemory = async () => {
    if (!event || !message.trim()) {
      setError('Please write a message')
      return
    }

    setLoading(true)
    setError('')

    let mediaType: 'image' | 'video' | 'none' = 'none'
    let mediaUrl: string | null = null

    if (file) {
      // MIME-based detection (non-negotiable per spec)
      if (file.type.startsWith('image/')) {
        mediaType = 'image'
      } else if (file.type.startsWith('video/')) {
        mediaType = 'video'
      } else {
        mediaType = 'none'
      }

      // Upload to storage - sanitize filename
      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .toLowerCase()
      const fileName = `${event.id}/${Date.now()}-${sanitizedFileName}`

      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setError('Failed to upload file')
        setLoading(false)
        return
      }

      // Get public URL
      const { data } = supabase.storage
        .from('memories')
        .getPublicUrl(fileName)

      mediaUrl = data.publicUrl
    }

    // Insert memory into database
    const { data: newMemory, error: insertError } = await supabase
      .from('memories')
      .insert({
        event_id: event.id,
        sender_name: name.trim() || 'Guest',
        message: message.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      setError('Failed to submit memory')
      setLoading(false)
      return
    }

    // Add to memories list
    setMemories([newMemory, ...memories])
    setLoading(false)
    setSubmitted(true)
    setName('')
    setMessage('')
    setFile(null)
  }

  if (!event && !error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400">Loading...</p>
      </main>
    )
  }

  if (error && !event) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/" className="text-blue-400 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center space-y-2 mb-10">
          <Link href="/" className="text-blue-400 hover:underline text-sm">
            ← Back
          </Link>
          <h1 className="text-4xl font-bold">{event?.name}</h1>
          <p className="text-gray-400">Leave a memory for this event</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            {!submitted ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  submitMemory()
                }}
                className="space-y-4 sticky top-10"
              >
                {/* Name Input */}
                <div>
                  <label className="text-sm text-gray-400">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-2 p-3 rounded bg-gray-900 border border-gray-700 focus:border-white outline-none text-white"
                    placeholder="Your name"
                  />
                </div>

                {/* Message Textarea */}
                <div>
                  <label className="text-sm text-gray-400">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full mt-2 p-3 rounded bg-gray-900 border border-gray-700 focus:border-white outline-none text-white text-sm"
                    placeholder="Write your memory..."
                    rows={4}
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="text-sm text-gray-400">
                    Photo or Video (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full mt-2 text-xs text-gray-400 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:bg-gray-900 file:text-white cursor-pointer"
                  />
                  {file && (
                    <p className="text-xs text-gray-500 mt-2">
                      📎 {file.name}
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && <p className="text-sm text-red-400">{error}</p>}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="w-full py-3 bg-white text-black rounded font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                  {loading ? '⏳ Submitting...' : '✨ Submit Memory'}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-4 sticky top-10 bg-gray-900 p-6 rounded border border-gray-700">
                <p className="text-5xl">✨</p>
                <h2 className="text-xl font-semibold">Memory Submitted!</h2>
                <p className="text-gray-400 text-sm">
                  Thank you for sharing
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setShowMemories(false)
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition"
                >
                  Submit Another
                </button>
              </div>
            )}
          </div>

          {/* Memories Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Memories ({memories.length})
              </h2>
              <button
                onClick={() => setShowMemories(!showMemories)}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                {showMemories ? 'Hide' : 'Show'}
              </button>
            </div>

            {showMemories && memories.length > 0 ? (
              <div className="space-y-4 max-h-[800px] overflow-y-auto">
                {memories.map((memory) => (
                  <div
                    key={memory.id}
                    className="border border-gray-700 rounded-lg p-4 bg-gray-900 hover:bg-gray-800 transition"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">
                          {memory.sender_name}
                        </p>
                        <p className="text-xs text-gray-500">
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
                      <span className="text-xs px-2 py-1 bg-gray-700 rounded">
                        {memory.media_type === 'none'
                          ? '📝'
                          : memory.media_type === 'image'
                            ? '🖼️'
                            : '🎥'}
                      </span>
                    </div>

                    {/* Message */}
                    <p className="text-sm text-gray-200 mb-3 whitespace-pre-wrap break-words">
                      {memory.message}
                    </p>

                    {/* Media */}
                    {memory.media_type === 'image' && memory.media_url && (
                      <img
                        src={memory.media_url}
                        alt="Memory"
                        className="w-full rounded max-h-60 object-cover"
                      />
                    )}

                    {memory.media_type === 'video' && memory.media_url && (
                      <video
                        controls
                        className="w-full rounded max-h-60"
                        src={memory.media_url}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : showMemories ? (
              <div className="text-center py-12 text-gray-400">
                <p>No memories yet</p>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900 rounded border border-gray-700">
                <p className="text-gray-400">
                  {memories.length} {memories.length === 1 ? 'memory' : 'memories'} submitted
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}