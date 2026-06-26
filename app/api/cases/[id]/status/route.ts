import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { STATUS_CONFIG } from '@/lib/constants'
import { z } from 'zod'

const StatusUpdateSchema = z.object({
  status: z.enum([
    'INTAKE', 'AWAITING_ESTIMATOR', 'ESTIMATOR_VISIT', 'QUOTE_SENT',
    'QUOTE_APPROVED', 'AWAITING_AUTHORIZATION', 'AUTHORIZED',
    'IN_REPAIR', 'COMPLETED', 'REJECTED', 'ON_HOLD',
  ]),
  note: z.string().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = StatusUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { status, note } = parsed.data

  const existing = await prisma.case.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const prevLabel = STATUS_CONFIG[existing.status].label
  const newLabel = STATUS_CONFIG[status].label

  const updated = await prisma.case.update({
    where: { id: params.id },
    data: {
      status: status as any,
      statusChangedAt: new Date(),
      activities: {
        create: {
          action: 'STATUS_CHANGED',
          details: `Status changed: ${prevLabel} → ${newLabel}${note ? `. Note: ${note}` : ''}`,
        },
      },
    },
  })

  return NextResponse.json(updated)
}
