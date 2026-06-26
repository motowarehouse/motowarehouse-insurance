import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizePlate } from '@/lib/utils'

async function getCase(id: string) {
  return prisma.case.findUnique({
    where: { id },
    include: {
      owner: true,
      customerInsurance: true,
      thirdPartyInsurance: true,
      internal: true,
      files: { orderBy: { uploadedAt: 'desc' } },
      activities: { orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const c = await getCase(params.id)
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(c)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { owner, customerInsurance, thirdPartyInsurance, internal, plate, ...caseData } = body

  const existing = await prisma.case.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const normalizedPlate = plate ? normalizePlate(plate) : existing.plate

  // Check plate conflict (not self)
  if (normalizedPlate !== existing.plate) {
    const conflict = await prisma.case.findUnique({ where: { plate: normalizedPlate } })
    if (conflict) {
      return NextResponse.json({ error: 'Plate already in use by another case.' }, { status: 409 })
    }
  }

  const updated = await prisma.case.update({
    where: { id: params.id },
    data: {
      ...caseData,
      plate: normalizedPlate,
      entryDate: caseData.entryDate ? new Date(caseData.entryDate) : undefined,
      vehicleRegistrationDate: caseData.vehicleRegistrationDate
        ? new Date(caseData.vehicleRegistrationDate)
        : null,
      owner: owner
        ? {
            upsert: {
              create: owner,
              update: owner,
            },
          }
        : undefined,
      customerInsurance: customerInsurance
        ? {
            upsert: {
              create: customerInsurance,
              update: customerInsurance,
            },
          }
        : undefined,
      thirdPartyInsurance: thirdPartyInsurance
        ? {
            upsert: {
              create: thirdPartyInsurance,
              update: thirdPartyInsurance,
            },
          }
        : undefined,
      internal: internal
        ? {
            upsert: {
              create: {
                ...internal,
                sentForPaymentDate: internal.sentForPaymentDate
                  ? new Date(internal.sentForPaymentDate)
                  : null,
              },
              update: {
                ...internal,
                sentForPaymentDate: internal.sentForPaymentDate
                  ? new Date(internal.sentForPaymentDate)
                  : null,
              },
            },
          }
        : undefined,
    },
    include: {
      owner: true,
      customerInsurance: true,
      thirdPartyInsurance: true,
      internal: true,
      files: true,
      activities: { orderBy: { createdAt: 'desc' } },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const c = await prisma.case.findUnique({ where: { id: params.id } })
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.case.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
