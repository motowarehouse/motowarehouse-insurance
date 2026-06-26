import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/r2'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const file = await prisma.caseFile.findUnique({ where: { id: params.id } })
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  // Delete from R2
  try {
    await deleteFile(file.r2Key)
  } catch (e) {
    console.error('R2 delete error:', e)
  }

  // Delete from DB
  await prisma.caseFile.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
