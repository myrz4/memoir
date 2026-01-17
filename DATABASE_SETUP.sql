-- SQL Setup for Memoir Database
-- Copy and paste this into Supabase SQL Editor to set up the database

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamp DEFAULT now()
);

-- Create memories table
CREATE TABLE IF NOT EXISTS public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sender_name text DEFAULT 'Guest',
  message text NOT NULL,
  media_url text,
  media_type text DEFAULT 'none' CHECK (media_type IN ('image','video','none')),
  created_at timestamp DEFAULT now()
);

-- Enable RLS on memories table
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public INSERT
CREATE POLICY "public insert memories"
ON public.memories
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 2: Public SELECT
CREATE POLICY "public read memories"
ON public.memories
FOR SELECT
TO public
USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_memories_event_id ON public.memories(event_id);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON public.memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
