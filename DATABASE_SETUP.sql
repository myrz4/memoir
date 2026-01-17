-- SQL Setup for Memoir Database
-- Copy and paste this into Supabase SQL Editor to set up the database

-- Drop existing tables if they exist (to reset)
DROP TABLE IF EXISTS public.memories CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;

-- Create events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  event_type text DEFAULT 'other',
  date timestamp,
  organizer_id uuid NOT NULL,
  is_locked boolean DEFAULT false,
  memory_count integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create memories table
CREATE TABLE public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sender_name text DEFAULT 'Guest',
  message text NOT NULL,
  media_url text,
  media_type text DEFAULT 'none' CHECK (media_type IN ('image','video','none')),
  created_at timestamp DEFAULT now()
);

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events RLS Policies
CREATE POLICY "public read events"
ON public.events
FOR SELECT
TO public
USING (true);

CREATE POLICY "authenticated create events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "organizer update events"
ON public.events
FOR UPDATE
TO authenticated
USING (auth.uid() = organizer_id)
WITH CHECK (auth.uid() = organizer_id);

-- Enable RLS on memories table
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Memories RLS Policies
CREATE POLICY "public insert memories"
ON public.memories
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "public read memories"
ON public.memories
FOR SELECT
TO public
USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_memories_event_id ON public.memories(event_id);
CREATE INDEX idx_memories_created_at ON public.memories(created_at DESC);
