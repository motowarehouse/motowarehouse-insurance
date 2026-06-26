import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companies = await prisma.insuranceCompany.findMany({
    include: {
      officers: { select: { id: true, name: true, phone: true, email: true } },
      _count: { select: { estimatorLinks: true } },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(companies)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, phone, email, notes } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const company = await prisma.insuranceCompany.create({
    data: { name: name.trim(), phone: phone || null, email: email || null, notes: notes || null },
  })
  return NextResponse.json(company, { status: 201 })
}
