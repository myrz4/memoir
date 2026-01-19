import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

export async function POST(req: NextRequest) {
  try {
    const { eventName, memories } = await req.json()

    const zip = new JSZip()

    // Create a summary file with all memories
    const summaryContent = memories
      .map(
        (memory: any, index: number) => `
Memory #${index + 1}
${'-'.repeat(50)}
Name: ${memory.sender_name || 'Anonymous'}
Date: ${new Date(memory.created_at).toLocaleDateString()}
Message: ${memory.message}
Media: ${memory.media_url ? 'Yes - ' + memory.media_type : 'None'}
`
      )
      .join('\n')

    zip.file('SUMMARY.txt', summaryContent)

    // Download and add media files
    for (const memory of memories) {
      if (memory.media_url) {
        try {
          const mediaResponse = await fetch(memory.media_url)
          const buffer = await mediaResponse.arrayBuffer()

          // Extract filename from URL or create one
          const urlParts = memory.media_url.split('/')
          const fileName = urlParts[urlParts.length - 1] || `memory_${memory.id}`

          zip.file(`memories/${fileName}`, buffer)
        } catch (mediaError) {
          console.error(`Failed to add ${memory.sender_name}'s media:`, mediaError)
          // Continue with other files even if one fails
        }
      }
    }

    // Generate ZIP
    const zipData = await zip.generateAsync({ type: 'arraybuffer' })

    // Return as downloadable file
    return new NextResponse(zipData, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${eventName}-memories.zip"`,
      },
    })
  } catch (error) {
    console.error('ZIP generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate ZIP file' },
      { status: 500 }
    )
  }
}
