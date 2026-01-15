'use client'

import { supabase } from '../src/lib/supabase'

export default function Home() {
  const testConnection = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')

    console.log('DATA:', data)
    console.log('ERROR:', error)
  }

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">Memoir</h1>

      <button
        onClick={testConnection}
        className="mt-4 px-4 py-2 bg-black text-white rounded"
      >
        Test Supabase Connection
      </button>
    </main>
  )
}