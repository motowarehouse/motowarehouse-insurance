import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUploadUrl, buildPublicUrl, buildKey } from '@/lib/r2'
import { z } from 'zod'

const UploadRequestSchema = z.object({
  caseId: z.string(),
  filename: z.string(),
  contentType: z.string(),
  size: z.number().optional(),
})

// Step 1: Get a pre-signed upload URL
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = UploadRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { caseId, filename, contentType, size } = parsed.data

  // Verify case exists
  const c = await prisma.case.findUnique({ where: { id: caseId } })
  if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  // Generate R2 key and pre-signed URL
  const r2Key = buildKey(caseId, filename)
  const uploadUrl = await getUploadUrl(r2Key, contentType)
  const publicUrl = buildPublicUrl(r2Key)

  // Create the file record in DB (pending upload)
  const file = await prisma.caseFile.create({
    data: {
      caseId,
      url: publicUrl,
      r2Key,
      name: filename,
      mimeType: contentType,
      size: size ?? null,
    },
  })

  // Log activity
  await prisma.activity.create({
    data: {
      caseId,
      action: 'FILE_UPLOADED',
      details: `File uploaded: ${filename}`,
    },
  })

  return NextResponse.json({ uploadUrl, file })
}
