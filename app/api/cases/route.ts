import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizePlate } from '@/lib/utils'
import { z } from 'zod'

const CreateCaseSchema = z.object({
  plate: z.string().min(1),
  entryDate: z.string(),
  brand: z.enum(['SYM', 'CFMOTO', 'OTHER']),
  model: z.string().min(1),
  mileage: z.number().optional().nullable(),
  vehicleRegistrationDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  owner: z.object({
    name: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
  }).optional(),
  customerInsurance: z.object({
    company: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    estimator: z.string().optional().nullable(),
    officer: z.string().optional().nullable(),
    caseNumber: z.string().optional().nullable(),
    companyId: z.string().optional().nullable(),
    officerId: z.string().optional().nullable(),
    estimatorId: z.string().optional().nullable(),
  }).optional(),
  thirdPartyInsurance: z.object({
    company: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    estimator: z.string().optional().nullable(),
    officer: z.string().optional().nullable(),
    caseNumber: z.string().optional().nullable(),
    companyId: z.string().optional().nullable(),
    officerId: z.string().optional().nullable(),
    estimatorId: z.string().optional().nullable(),
  }).optional(),
  internal: z.object({
    estimateNumber: z.string().optional().nullable(),
    invoiceNumber: z.string().optional().nullable(),
    sentForPaymentDate: z.string().optional().nullable(),
    paymentDetails: z.string().optional().nullable(),
  }).optional(),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const brand = searchParams.get('brand')
  const search = searchParams.get('search')

  const cases = await prisma.case.findMany({
    where: {
      ...(status && status !== 'ALL' ? { status: status as any } : {}),
      ...(brand && brand !== 'ALL' ? { brand: brand as any } : {}),
      ...(search
        ? {
            OR: [
              { plate: { contains: search, mode: 'insensitive' } },
              { model: { contains: search, mode: 'insensitive' } },
              { owner: { name: { contains: search, mode: 'insensitive' } } },
              { customerInsurance: { company: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      owner: { select: { name: true } },
      customerInsurance: { select: { company: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(cases)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = CreateCaseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { plate, owner, customerInsurance, thirdPartyInsurance, internal, ...caseData } = parsed.data
  const normalizedPlate = normalizePlate(plate)

  // Check for duplicate plate
  const existing = await prisma.case.findUnique({ where: { plate: normalizedPlate } })
  if (existing) {
    return NextResponse.json({ error: 'A case with this plate already exists.' }, { status: 409 })
  }

  const newCase = await prisma.case.create({
    data: {
      ...caseData,
      plate: normalizedPlate,
      entryDate: new Date(caseData.entryDate),
      vehicleRegistrationDate: caseData.vehicleRegistrationDate
        ? new Date(caseData.vehicleRegistrationDate)
        : null,
      owner: owner ? { create: owner } : undefined,
      customerInsurance: customerInsurance ? { create: customerInsurance } : undefined,
      thirdPartyInsurance: thirdPartyInsurance ? { create: thirdPartyInsurance } : undefined,
      internal: internal
        ? {
            create: {
              ...internal,
              sentForPaymentDate: internal.sentForPaymentDate
                ? new Date(internal.sentForPaymentDate)
                : null,
            },
          }
        : undefined,
      activities: {
        create: {
          action: 'CASE_CREATED',
          details: `Case opened for ${normalizedPlate}`,
        },
      },
    },
    include: {
      owner: true,
      customerInsurance: true,
      thirdPartyInsurance: true,
      internal: true,
    },
  })

  return NextResponse.json(newCase, { status: 201 })
}
