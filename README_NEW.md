# Memoir - Memory Sharing Platform

A web application for guests to submit memories (text, photos, videos) for special events.

## Project Overview

Memoir enables event organizers to collect memories from guests without requiring authentication. Guests can:
- Write messages
- Upload photos or videos
- Share memories anonymously or with their name
- All submissions are stored securely in Supabase

## Quick Start

### 1. Database Setup (REQUIRED)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open **SQL Editor**
3. Copy and paste the entire content of `DATABASE_SETUP.sql`
4. Execute the script
5. Verify tables are created

### 2. Supabase Storage Setup

1. Go to **Storage** section
2. Click **Create bucket**
3. Name: `memories` (exact case)
4. Toggle **Public** ON
5. Create

### 3. Environment Variables

Check `.env.local` for Supabase credentials (already configured):
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 4. Run Development Server

```bash
npm install
npm run dev
```

Visit: http://localhost:3000

## Architecture

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Home - enter event name to access |
| `/event/[slug]` | Memory submission form |
| `/admin` | View all memories for an event |

### Database Schema

**events table:**
- `id` (UUID, primary key)
- `name` (text) - event name
- `slug` (text, unique) - URL-friendly identifier
- `created_at` (timestamp)

**memories table:**
- `id` (UUID, primary key)
- `event_id` (UUID, foreign key)
- `sender_name` (text, default: 'Guest')
- `message` (text, required)
- `media_url` (text, nullable)
- `media_type` (enum: 'image', 'video', 'none')
- `created_at` (timestamp)

### Row Level Security (RLS)

- **Public INSERT**: Anyone can submit memories
- **Public SELECT**: Anyone can view memories
- **No UPDATE/DELETE**: Prevents guest tampering

## Media Handling

### Detection Logic

Media type is detected **before upload** using MIME types:

```typescript
let mediaType: 'image' | 'video' | 'none';

if (!file) {
  mediaType = 'none';
} else if (file.type.startsWith('image/')) {
  mediaType = 'image';
} else if (file.type.startsWith('video/')) {
  mediaType = 'video';
} else {
  mediaType = 'none';
}
```

### Storage Structure

```
memories/
└── [event_id]/
    ├── 1768450000000-photo.jpg
    ├── 1768450001000-video.mp4
    └── ...
```

### Rendering

The app uses `media_type` field (NOT URL) to determine how to render:
- `image` → `<img src={media_url} />`
- `video` → `<video src={media_url} controls />`
- `none` → Text only

## Creating Test Events

### Via Supabase SQL:
```sql
INSERT INTO public.events (name, slug) 
VALUES ('Demo Wedding', 'demo-wedding');
```

### Via App:
1. Visit http://localhost:3000
2. Enter "demo-wedding"
3. Click "Access Event"
4. Submit a test memory

## Key Features

✅ **Anonymous Submissions** - No authentication required
✅ **Media Upload** - Photos & videos to Supabase Storage
✅ **MIME Type Detection** - Reliable file type identification
✅ **Public Access** - Guests can submit without friction
✅ **Optional Names** - Sign memories or stay anonymous
✅ **Real-time** - Memories appear immediately
✅ **Admin View** - See all memories at `/admin`

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL + Storage)
- **Styling**: Tailwind CSS
- **Auth**: Public (no authentication)
- **Deployment**: Vercel-ready

## Project File Structure

```
memoir/
├── app/
│   ├── page.tsx              # Home page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── event/
│   │   └── [slug]/
│   │       └── page.tsx      # Event submission page
│   └── admin/
│       └── page.tsx          # Admin memories viewer
├── src/
│   └── lib/
│       └── supabase.ts       # Supabase client
├── public/                   # Static assets
├── DATABASE_SETUP.sql        # Database initialization
├── SETUP_GUIDE.md            # Detailed setup guide
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## Deployment to Vercel

```bash
# Build locally
npm run build

# Deploy
vercel deploy --prod
```

**Ensure:**
1. Environment variables are set on Vercel
2. Supabase CORS allows your Vercel domain
3. Storage bucket remains public

## Admin View

Visit `/admin` to search for and view all memories for an event:
- Enter event slug
- View all submissions
- See images and videos inline
- Check metadata (names, timestamps)

## Troubleshooting

### "Event not found"
- Create the event first: `INSERT INTO events (name, slug) VALUES (...)`
- Ensure slug matches exactly (case-sensitive)

### Files not uploading
- Verify `memories` bucket exists and is **Public**
- Check file size (Supabase has upload limits)
- Check browser console for errors

### Media type incorrect
- Verify file's MIME type: `console.log(file.type)`
- MIME detection happens client-side before upload
- Check database `media_type` field

### Build fails
- Run `npm install` to ensure dependencies
- Check `.env.local` has correct Supabase keys
- Verify no TypeScript errors: `npx tsc --noEmit`

## Future Enhancements

- [ ] Event moderation tools
- [ ] Memory deletion by owners
- [ ] Email notifications
- [ ] Custom event branding
- [ ] Gallery/timeline view
- [ ] Analytics dashboard
- [ ] Export memories
- [ ] Event scheduling

## License

MIT

---

**Status:** MVP Complete ✅
**Last Updated:** January 16, 2026
