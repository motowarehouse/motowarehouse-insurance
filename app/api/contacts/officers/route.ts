import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')

  const officers = await prisma.officer.findMany({
    where: companyId ? { companyId } : undefined,
    include: { company: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(officers)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, phone, email, companyId } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!companyId) return NextResponse.json({ error: 'Company is required' }, { status: 400 })

  const officer = await prisma.officer.create({
    data: { name: name.trim(), phone: phone || null, email: email || null, companyId },
    include: { company: { select: { id: true, name: true } } },
  })
  return NextResponse.json(officer, { status: 201 })
}
