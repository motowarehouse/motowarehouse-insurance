import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, phone, email, companyId } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const officer = await prisma.officer.update({
    where: { id: params.id },
    data: { name: name.trim(), phone: phone || null, email: email || null, companyId },
    include: { company: { select: { id: true, name: true } } },
  })
  return NextResponse.json(officer)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.officer.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
