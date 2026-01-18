'use client'

import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Memory {
  id: string
  sender_name: string
  message: string
  media_url: string | null
  created_at: string
  media_type: 'image' | 'video' | 'none'
}

interface Event {
  id: string
  name: string
  slug: string
  organizer_id: string
  is_locked: boolean
  memory_count: number
}

export default function EventPage() {
  const { slug } = useParams()
  const router = useRouter()
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')

  const [event, setEvent] = useState<Event | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isOrganizerView, setIsOrganizerView] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [guestMode, setGuestMode] = useState(searchParams.get('mode') === 'guest')

  // Fetch event and memories
  useEffect(() => {
    if (!slug) return

    const fetchData = async () => {
      // Get current user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      setUser(currentUser)

      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single()

      if (eventError) {
        setError('Event not found')
        setPageLoading(false)
        return
      }

      setEvent(eventData)

      // Check if current user is the organizer
      if (currentUser && currentUser.id === eventData.organizer_id && !guestMode) {
        setIsOrganizerView(true)
      }

      // Fetch memories
      const { data: memoriesData } = await supabase
        .from('memories')
        .select('*')
        .eq('event_id', eventData.id)
        .order('created_at', { ascending: false })

      setMemories(memoriesData || [])
      setPageLoading(false)
    }

    fetchData()
  }, [slug])

  const submitMemory = async () => {
    if (!event || !message.trim()) {
      setError('Please write a message')
      return
    }

    // Check if event exists in database
    const { data: eventCheck, error: checkError } = await supabase
      .from('events')
      .select('id')
      .eq('id', event.id)
      .single()

    if (checkError || !eventCheck) {
      setError('This event no longer exists')
      return
    }

    // Check if event is locked FIRST
    if (event.is_locked) {
      setError('This event is closed and is not accepting new memories')
      return
    }

    setLoading(true)
    setError('')

    let mediaUrl: string | null = null
    let mediaType: 'image' | 'video' | 'none' = 'none'

    if (file) {
      mediaType = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : 'none'

      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .toLowerCase()
      const fileName = `${event.id}/${Date.now()}-${sanitizedFileName}`

      try {
        const { error: uploadError } = await supabase.storage
          .from('memories')
          .upload(fileName, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          setError('Failed to upload file. Please try again.')
          setLoading(false)
          return
        }

        const { data } = supabase.storage
          .from('memories')
          .getPublicUrl(fileName)

        mediaUrl = data.publicUrl
      } catch (err) {
        console.error('File upload error:', err)
        setError('Failed to upload file. Storage might not be configured.')
        setLoading(false)
        return
      }
    }

    try {
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
        setError('Failed to submit memory. Please try again.')
        setLoading(false)
        return
      }

      // Increment memory count in events table
      const { error: updateError } = await supabase
        .from('events')
        .update({ memory_count: memories.length + 1 })
        .eq('id', event.id)

      if (updateError) {
        console.error('Update error:', updateError)
        // Don't fail the submission if counter update fails
      }

      setMemories([newMemory, ...memories])
      setLoading(false)
      setSubmitted(true)
      setName('')
      setMessage('')
      setFile(null)
    } catch (err) {
      console.error('Error submitting memory:', err)
      setError('Failed to submit memory. Please try again.')
      setLoading(false)
    }
  }

  const lockEvent = async () => {
    if (!event) return
    const { error } = await supabase
      .from('events')
      .update({ is_locked: true })
      .eq('id', event.id)

    if (!error) {
      setEvent({ ...event, is_locked: true })
    }
  }

  const unlockEvent = async () => {
    if (!event) return
    const { error } = await supabase
      .from('events')
      .update({ is_locked: false })
      .eq('id', event.id)

    if (!error) {
      setEvent({ ...event, is_locked: false })
    }
  }

  const deleteEvent = async () => {
    if (!event) return
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${event.name}"? This action cannot be undone.`
    )
    
    if (!confirmDelete) return

    setLoading(true)
    try {
      // Delete the event (memories will cascade delete automatically)
      // Note: Media files in storage will remain but are orphaned and harmless
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id)

      if (deleteError) throw deleteError
      
      // Redirect to dashboard after successful deletion
      router.push('/dashboard')
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete event')
      setLoading(false)
    }
  }

  const deleteMemory = async (memoryId: string) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this memory? This action cannot be undone.'
    )
    
    if (!confirmDelete) return

    try {
      // Delete the memory record
      const { error: deleteError } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId)

      if (deleteError) {
        console.error('Delete error details:', deleteError)
        throw new Error(deleteError.message || 'Failed to delete memory')
      }

      // Update memory count
      const newCount = Math.max(0, (event?.memory_count || 0) - 1)
      const { error: updateError } = await supabase
        .from('events')
        .update({ memory_count: newCount })
        .eq('id', event?.id)

      if (updateError) throw updateError

      // Update local state
      setMemories(memories.filter((m) => m.id !== memoryId))
      setEvent(event ? { ...event, memory_count: newCount } : null)
      setError('') // Clear any previous errors
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete memory'
      console.error('Delete memory error:', err)
      setError(errorMessage)
      // Show error for 5 seconds
      setTimeout(() => setError(''), 5000)
    }
  }

  const copyEventLink = () => {
    const url = `${window.location.origin}/event/${event?.slug}?mode=guest`
    navigator.clipboard.writeText(url)
    alert('Event link copied!')
  }

  const downloadQRCode = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      `${window.location.origin}/event/${event?.slug}?mode=guest`
    )}`
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `${event?.slug}-qr.png`
    link.click()
  }

  // Event is locked
  if (event && event.is_locked && !isOrganizerView) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">🔒</div>
          <h1 className="text-3xl font-bold">This event is closed</h1>
          <p className="text-gray-300 text-lg">
            Thank you for being a part of this memory ❤️
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Back to Home
          </Link>
        </div>
      </main>
    )
  }

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    )
  }

  if (error && !event) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg">{error}</p>
          <Link href="/" className="text-white hover:underline font-semibold">
            ← Back to Home
          </Link>
        </div>
      </main>
    )
  }

  if (!event) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white">
      {/* Organizer Header */}
      {isOrganizerView && (
        <div className="border-b border-gray-700 bg-black/50 backdrop-blur sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">MEMOIR</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded font-semibold hover:bg-gray-800 transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Organizer View */}
        {isOrganizerView ? (
          <>
            {/* Event Header */}
            <div className="mb-12 space-y-6">
              <h1 className="text-4xl font-bold">{event.name} 💍</h1>

              {/* Event Link Section */}
              <div className="bg-slate-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Event Link:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/event/${event.slug}`}
                      className="flex-1 px-4 py-2 bg-slate-900 border border-gray-600 rounded text-white text-sm"
                    />
                    <button
                      onClick={copyEventLink}
                      className="px-4 py-2 bg-white text-black rounded font-semibold hover:bg-gray-200 transition text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* QR Code Section */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">QR Code:</p>
                  <div className="flex gap-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        `${window.location.origin}/event/${event.slug}`
                      )}`}
                      alt="QR Code"
                      className="w-40 h-40 bg-white p-2 rounded"
                    />
                    <button
                      onClick={downloadQRCode}
                      className="px-4 py-2 bg-white text-black rounded font-semibold hover:bg-gray-200 transition h-fit"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition">
                  Export to Google Drive
                </button>
                <button
                  onClick={event.is_locked ? unlockEvent : lockEvent}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    event.is_locked
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  {event.is_locked ? '🔓 Unlock Event' : '🔒 Lock Event'}
                </button>
                <button
                  onClick={deleteEvent}
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  🗑️ Delete Event
                </button>
              </div>
            </div>

            {/* Memories Grid */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Memories ({memories.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {memories.map((memory) => (
                  <div
                    key={memory.id}
                    className="bg-slate-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-500 transition group relative"
                  >
                    {memory.media_type === 'image' && memory.media_url && (
                      <img
                        src={memory.media_url}
                        alt={memory.sender_name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    {memory.media_type === 'video' && memory.media_url && (
                      <video
                        controls
                        className="w-full h-48 object-cover bg-black"
                        src={memory.media_url}
                      />
                    )}
                    {/* Delete Button - appears on hover */}
                    <button
                      onClick={() => deleteMemory(memory.id)}
                      className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-semibold opacity-0 group-hover:opacity-100 transition"
                    >
                      🗑️ Delete
                    </button>
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{memory.sender_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(memory.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-lg">
                          {memory.media_type === 'image'
                            ? '📸'
                            : memory.media_type === 'video'
                              ? '🎥'
                              : '💬'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-3">
                        {memory.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {memories.length === 0 && (
                <p className="text-center text-gray-400 py-12">
                  No memories yet. Share the event link to get started!
                </p>
              )}
            </div>
          </>
        ) : (
          /* Attendee View */
          <div className="max-w-2xl mx-auto">
            {/* Event Header */}
            <div className="text-center mb-12 space-y-4">
              <h1 className="text-4xl font-bold">{event.name} 💍</h1>
              <p className="text-xl text-gray-300">Leave a memory ❤️</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Upload Form */}
              <div className="lg:col-span-1">
                {!submitted ? (
                  <div className="bg-slate-800/50 backdrop-blur border border-gray-700 rounded-lg p-6 space-y-4 sticky top-20">
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      submitMemory()
                    }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Name (optional)
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="w-full px-4 py-2 bg-slate-900 border border-gray-600 rounded focus:border-white outline-none text-white placeholder-gray-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Message
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Write your memory..."
                          rows={5}
                          className="w-full px-4 py-2 bg-slate-900 border border-gray-600 rounded focus:border-white outline-none text-white placeholder-gray-500 transition resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Upload Photo
                        </label>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          className="w-full text-xs text-gray-400 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:bg-white file:text-black file:font-semibold cursor-pointer"
                        />
                        {file && (
                          <p className="text-xs text-gray-400 mt-2">
                            ✓ {file.name}
                          </p>
                        )}
                      </div>

                      {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-300 px-3 py-2 rounded text-sm">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading || !message.trim()}
                        className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50"
                      >
                        {loading ? 'Submitting...' : 'Submit Memory'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-slate-800/50 backdrop-blur border border-gray-700 rounded-lg p-6 text-center space-y-4 sticky top-20">
                    <div className="text-5xl">✅</div>
                    <h2 className="text-2xl font-bold">Memory submitted</h2>
                    <p className="text-gray-300">Thank you for sharing ❤️</p>
                    <button
                      onClick={() => {
                        setSubmitted(false)
                        setName('')
                        setMessage('')
                        setFile(null)
                      }}
                      className="w-full py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition text-sm"
                    >
                      Share Another
                    </button>
                  </div>
                )}
              </div>

              {/* Memories List */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold mb-6">
                  Memories ({memories.length})
                </h2>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {memories.map((memory) => (
                    <div
                      key={memory.id}
                      className="bg-slate-800/50 border border-gray-700 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{memory.sender_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(memory.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-lg">
                          {memory.media_type === 'image'
                            ? '📸'
                            : memory.media_type === 'video'
                              ? '🎥'
                              : '💬'}
                        </span>
                      </div>
                      {memory.media_type === 'image' && memory.media_url && (
                        <img
                          src={memory.media_url}
                          alt="Memory"
                          className="w-full rounded max-h-48 object-cover"
                        />
                      )}
                      {memory.media_type === 'video' && memory.media_url && (
                        <video
                          controls
                          className="w-full rounded max-h-48 bg-black"
                          src={memory.media_url}
                        />
                      )}
                      <p className="text-sm text-gray-200">{memory.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}