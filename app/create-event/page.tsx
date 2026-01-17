'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/src/lib/supabase'

export default function CreateEventPage() {
  const [eventName, setEventName] = useState('')
  const [eventType, setEventType] = useState('wedding')
  const [eventDate, setEventDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
    }
    checkAuth()
  }, [router])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!eventName.trim()) {
      setError('Event name is required')
      return
    }

    setLoading(true)

    try {
      const slug = generateSlug(eventName)

      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
          name: eventName,
          event_type: eventType,
          date: eventDate || null,
          slug,
          organizer_id: user.id,
          is_locked: false,
          memory_count: 0,
        })
        .select()

      if (insertError) throw insertError

      if (data && data[0]) {
        router.push(`/event/${data[0].slug}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const eventTypes = [
    { value: 'wedding', label: 'Wedding' },
    { value: 'graduation', label: 'Graduation' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'reunion', label: 'Reunion' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur border border-gray-700 rounded-lg p-8 space-y-6">
          <div className="text-center">
            <Link href="/" className="inline-block mb-4 hover:opacity-80 transition">
              <h1 className="text-3xl font-bold">MEMOIR</h1>
            </Link>
            <p className="text-gray-400">Create a new event</p>
          </div>

          <form onSubmit={handleCreateEvent} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Event Name</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., Sarah & John's Wedding"
                className="w-full px-4 py-3 bg-slate-900 border border-gray-600 rounded-lg focus:border-white outline-none text-white placeholder-gray-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-gray-600 rounded-lg focus:border-white outline-none text-white transition"
              >
                {eventTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Event Date (Optional)</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-gray-600 rounded-lg focus:border-white outline-none text-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? 'Creating event...' : 'Create Event'}
            </button>
          </form>

          <div className="text-center text-sm text-gray-400">
            <Link href="/dashboard" className="text-white font-semibold hover:underline">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
