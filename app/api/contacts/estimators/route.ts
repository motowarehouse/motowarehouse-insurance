import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const estimators = await prisma.estimator.findMany({
    include: {
      companyLinks: { include: { company: { select: { id: true, name: true } } } },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(estimators)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, phone, email, notes, companyIds } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const estimator = await prisma.estimator.create({
    data: {
      name: name.trim(),
      phone: phone || null,
      email: email || null,
      notes: notes || null,
      companyLinks: companyIds?.length
        ? { create: companyIds.map((id: string) => ({ companyId: id })) }
        : undefined,
    },
    include: { companyLinks: { include: { company: { select: { id: true, name: true } } } } },
  })
  return NextResponse.json(estimator, { status: 201 })
}
