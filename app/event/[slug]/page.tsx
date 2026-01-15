'use client'

import { useParams } from 'next/navigation'
import { supabase } from '../../../src/lib/supabase'
import { useEffect, useState } from 'react'

export default function EventPage() {
  const { slug } = useParams()

  const [event, setEvent] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch event by slug
  useEffect(() => {
    if (!slug) return

    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!error) setEvent(data)
    }

    fetchEvent()
  }, [slug])

  const submitMemory = async () => {
    if (!message.trim() || !event) return

    setLoading(true)

    let photoUrl = null

    // Upload photo if exists
    if (photo) {
      const fileExt = photo.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(fileName, photo)

      if (!uploadError) {
        const { data } = supabase.storage
          .from('memories')
          .getPublicUrl(fileName)

        photoUrl = data.publicUrl
      }
    }

    await supabase.from('memories').insert({
      event_id: event.id,
      sender_name: name.trim() || 'Guest',
      message: message.trim(),
      media_url: photoUrl,
    })

    setLoading(false)
    setSubmitted(true)
  }

  if (!event) return <p className="p-10">Loading...</p>

  return (
    <main className="min-h-screen flex justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold">
            {event.name} 💍
          </h1>
          <p className="text-gray-400">
            Leave a memory ❤️
          </p>
        </div>

        {!submitted ? (
          <>
            {/* Name */}
            <div>
              <label className="text-sm text-gray-400">
                Name (optional)
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 p-3 rounded bg-black border border-gray-700"
                placeholder="Your name"
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm text-gray-400">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full mt-1 p-3 rounded bg-black border border-gray-700"
                placeholder="Write your memory..."
                rows={4}
              />
            </div>

            {/* Photo */}
            <div>
              <label className="text-sm text-gray-400">
                Upload Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="mt-2 text-sm"
              />
            </div>

            {/* Submit */}
            <button
              onClick={submitMemory}
              disabled={loading}
              className="w-full py-3 bg-white text-black rounded font-semibold"
            >
              {loading ? 'Submitting...' : 'Submit Memory'}
            </button>
          </>
        ) : (
          <div className="text-center space-y-2 pt-10">
            <p className="text-2xl">✅</p>
            <p className="font-semibold">Memory submitted</p>
            <p className="text-gray-400">Thank you for sharing ❤️</p>
          </div>
        )}
      </div>
    </main>
  )
}