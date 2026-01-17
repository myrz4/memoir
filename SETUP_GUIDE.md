# Memoir - Setup & Documentation

## Project Status ✅

### Completed
- ✅ Frontend Pages
  - Home page (/) - enter event name
  - Event submission page (/event/[slug]) - submit memories with media
- ✅ Media Detection (MIME-type based, NOT filename)
- ✅ Supabase Client configured
- ✅ TypeScript setup
- ✅ Tailwind CSS configured
- ✅ File upload to Supabase Storage

### Setup Instructions

#### 1. Database Setup (CRITICAL)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project SQL editor
3. Copy the entire content of `DATABASE_SETUP.sql`
4. Paste and execute in the SQL editor
5. Verify tables and RLS policies are created

**What gets created:**
- `events` table (id, name, slug, created_at)
- `memories` table (id, event_id, sender_name, message, media_url, media_type, created_at)
- RLS policies for public INSERT and SELECT
- Indexes for performance

#### 2. Supabase Storage Setup
1. Go to Storage in Supabase
2. Create a bucket named `memories` (case-sensitive)
3. Set it to **Public** (✅ Allow public access)
4. Leave CORS and other settings default

#### 3. Environment Variables
Check `.env.local` - you already have:
```
NEXT_PUBLIC_SUPABASE_URL=<your_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_key>
```

#### 4. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:3000`

### How It Works

#### Home Page (/)
- User enters an event name (e.g., "my-wedding")
- Slug is auto-formatted (lowercase, hyphens)
- Clicking "Access Event" goes to `/event/my-wedding`

#### Event Page (/event/[slug])
1. **Fetches the event** from database
2. **Shows form** for submitting memories:
   - Name (optional)
   - Message (required)
   - Photo or Video (optional)
3. **On Submit:**
   - Detects media type using MIME type (not filename!)
   - Uploads file to `memories/[event_id]/[timestamp]-[filename]`
   - Gets public URL from Supabase Storage
   - Inserts row in memories table with all data
   - Shows success state

### Media Type Detection

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

**This is stored in the database** - not inferred from URL or filename.

### Data Structure

#### events table
```
id: UUID
name: string
slug: string (unique)
created_at: timestamp
```

#### memories table
```
id: UUID
event_id: UUID (foreign key to events)
sender_name: string (default: 'Guest')
message: string (required)
media_url: string (can be null for text-only)
media_type: enum ('image', 'video', 'none')
created_at: timestamp
```

### Creating Test Data

Run this in Supabase SQL editor to create a test event:

```sql
INSERT INTO public.events (name, slug)
VALUES ('Demo Wedding', 'demo-wedding')
RETURNING id;
```

Then visit `http://localhost:3000/event/demo-wedding` to test submissions.

### Storage Bucket Structure

```
memories/
├── [event_id_1]/
│   ├── 1768450000000-photo1.jpg
│   ├── 1768450001000-video.mp4
│   └── ...
├── [event_id_2]/
│   ├── ...
└── ...
```

Files are public URLs after upload.

### Features Implemented

✅ **Memory Submission Flow**
- Event lookup by slug
- Form with name, message, file upload
- MIME-type based media detection
- File upload to Storage
- Database insertion with media_type
- Success confirmation

✅ **Error Handling**
- Event not found
- Missing message validation
- Upload failures
- Insert errors
- User-friendly error messages

✅ **Media Support**
- Images (jpg, png, gif, webp, etc.)
- Videos (mp4, webm, etc.)
- Text-only (no file)
- All stored with correct media_type

### Future Features

- [ ] Admin page to view event memories
- [ ] Delete/moderate memories
- [ ] Email notifications
- [ ] Custom event branding
- [ ] Memory gallery view
- [ ] Analytics

### Deployment

When ready for production:
1. Update environment variables on Vercel
2. Ensure Supabase allows your Vercel domain in CORS
3. Run `npm run build` locally to verify
4. Deploy to Vercel: `vercel deploy`

### Troubleshooting

**Q: "Event not found"**
- Create the event first in Supabase
- Check the slug matches exactly (case-sensitive)

**Q: Files not uploading**
- Check Storage bucket is named exactly `memories`
- Verify it's set to PUBLIC
- Check file size (Supabase has limits)

**Q: Media type showing wrong in database**
- MIME type detection is client-side
- Check browser console for `mediaType being saved`
- Verify file.type is being detected correctly

### Need to Create an Event Programmatically?

```typescript
const { data, error } = await supabase
  .from('events')
  .insert({
    name: 'My Event',
    slug: 'my-event'
  })
  .select()
  .single()
```

---

**Last Updated:** January 16, 2026
