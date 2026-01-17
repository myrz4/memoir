'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase'

interface Event {
  id: string
  name: string
  eventType: string
  date: string | null
  slug: string
  memoryCount: number
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
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
      loadEvents(user.id)
    }
    checkAuth()
  }, [router])

  const loadEvents = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (err) {
      console.error('Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getEventEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      wedding: '💍',
      graduation: '🎓',
      birthday: '🎂',
      anniversary: '💕',
      reunion: '👥',
      other: '🎉',
    }
    return emojis[type] || emojis.other
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-black/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">MEMOIR</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/create-event"
              className="px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              + Create Event
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded font-semibold hover:bg-gray-800 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-2">My Events</h2>
          <p className="text-gray-400">Manage your events and view memories</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-gray-400 text-lg">No events yet</p>
            <Link
              href="/create-event"
              className="inline-block px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/event/${event.slug}`}
                className="block p-6 bg-slate-800/50 border border-gray-700 rounded-lg hover:border-gray-500 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-3xl">{getEventEmoji(event.eventType)}</span>
                    <div>
                      <h3 className="text-xl font-semibold">{event.name}</h3>
                      {event.date && (
                        <p className="text-sm text-gray-400">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{event.memoryCount}</p>
                    <p className="text-sm text-gray-400">memories</p>
                  </div>
                  <span className="ml-6 text-gray-500">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
