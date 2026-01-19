import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function POST(req: NextRequest) {
  try {
    const { accessToken, eventName, memories } = await req.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 400 }
      )
    }

    // Initialize Google Drive API with the user's access token
    const drive = google.drive({
      version: 'v3',
      auth: new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
      ),
    })

    // Set the access token on the auth client
    ;(drive.context as any)._options.auth.setCredentials({
      access_token: accessToken,
    })

    // Create a folder for the event
    const folderMetadata = {
      name: `Memoir - ${eventName}`,
      mimeType: 'application/vnd.google-apps.folder',
    }

    const folderRes = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, webViewLink',
    })

    const folderId = folderRes.data.id
    const folderLink = folderRes.data.webViewLink

    // Create a summary file with event metadata
    const summaryContent = memories
      .map(
        (memory: any, index: number) => `
Memory #${index + 1}
---
Name: ${memory.sender_name || 'Anonymous'}
Date: ${new Date(memory.created_at).toLocaleDateString()}
Message: ${memory.message}
Media: ${memory.media_url ? 'Yes - ' + memory.media_type : 'None'}
`
      )
      .join('\n')

    const summaryMetadata = {
      name: `${eventName} - Summary.txt`,
      parents: [folderId],
    }

    await drive.files.create({
      requestBody: summaryMetadata,
      media: {
        mimeType: 'text/plain',
        body: summaryContent,
      },
    })

    // Download and upload media files
    for (const memory of memories) {
      if (memory.media_url) {
        try {
          // Fetch the media file from Supabase
          const mediaResponse = await fetch(memory.media_url)
          const buffer = await mediaResponse.arrayBuffer()

          // Determine file extension
          const extension = memory.media_type === 'image' ? '.jpg' : '.mp4'
          const fileName = `${memory.sender_name || 'memory'}-${memory.created_at}${extension}`

          // Upload to Google Drive
          const fileMetadata = {
            name: fileName,
            parents: [folderId],
          }

          await drive.files.create({
            requestBody: fileMetadata,
            media: {
              mimeType: memory.media_type === 'image' ? 'image/jpeg' : 'video/mp4',
              body: buffer,
            },
          })
        } catch (mediaError) {
          console.error(`Failed to upload ${memory.sender_name}'s media:`, mediaError)
          // Continue with other files even if one fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      folderLink: folderLink,
      folderId: folderId,
    })
  } catch (error) {
    console.error('Export to Drive error:', error)
    return NextResponse.json(
      { error: 'Failed to export to Google Drive' },
      { status: 500 }
    )
  }
}
