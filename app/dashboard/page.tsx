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
      <header className="border-b border-gray-700/30 bg-black/40 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">✨ MEMOIR</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/create-event"
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-pink-500/50 transition"
            >
              + New Event
            </Link>
            <button
              onClick={handleLogout}
              className="px-6 py-2 rounded-lg font-semibold hover:bg-gray-800/50 transition border border-gray-700/50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-3">My Events</h2>
          <p className="text-gray-400 text-lg">Manage your events and celebrate memories</p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">Loading your events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 space-y-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-700/50 rounded-2xl p-12">
            <p className="text-gray-400 text-lg">No events created yet</p>
            <Link
              href="/create-event"
              className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-pink-500/50 transition"
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/event/${event.slug}`}
                className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-700/50 rounded-2xl overflow-hidden hover:border-gray-500 transition hover:shadow-2xl hover:shadow-slate-900/50"
              >
                <div className="p-8 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{getEventEmoji(event.eventType)}</span>
                        <h3 className="text-2xl font-bold group-hover:text-pink-300 transition">{event.name}</h3>
                      </div>
                      {event.date && (
                        <p className="text-sm text-gray-400">
                          📅 {new Date(event.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-gray-700/30">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-pink-300">{event.memoryCount}</span>
                      <span className="text-gray-400">memories captured</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700/30">
                    <span className="text-sm text-gray-400">View details</span>
                    <span className="text-gray-500 group-hover:text-pink-300 transition">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
