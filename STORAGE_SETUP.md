# Memoir - Setup Guide

## Storage Bucket Setup (Required for photo/video uploads)

The photo and video upload feature requires a Supabase Storage bucket. Follow these steps:

### Step 1: Create the Storage Bucket

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Click on **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Name it: `memories` (exactly this name)
5. **Uncheck** "Private bucket" (make it PUBLIC)
6. Click **Create bucket**

### Step 2: Set Up Storage Policies

After creating the bucket, you need to set up RLS policies:

1. In the **Storage** section, click on the `memories` bucket
2. Click on the **Policies** tab
3. Click **New Policy**
4. Choose **For INSERT** and select **Public** from the template
5. Click **Use this template**, then **Review**, then **Save policy**
6. Repeat for **SELECT** policy:
   - Click **New Policy**
   - Choose **For SELECT** and select **Public**
   - Click **Use this template**, then **Review**, then **Save policy**

Alternatively, run these SQL commands in the SQL Editor:

```sql
CREATE POLICY "Public uploads" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'memories');

CREATE POLICY "Public reads" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'memories');
```

### Step 3: Test Upload

1. Go to an event page as a guest (incognito window or logged out)
2. Try uploading a photo or video
3. It should now work!

## Event Locking (Now Fixed)

- **Lock Event**: Prevents guests from submitting new memories
- **Unlock Event**: Re-opens the event to accept memories
- When an event is locked, guests see: "This event is closed 🔒" message
- Organizers can toggle lock/unlock anytime

## Troubleshooting

**Still can't upload files?**
- Make sure the bucket is named exactly `memories`
- Make sure it's PUBLIC (not private)
- Check that both INSERT and SELECT policies exist
- Clear browser cache and try again

**Lock still not working?**
- Refresh the page
- Try again - the fix should prevent submissions on locked events now
