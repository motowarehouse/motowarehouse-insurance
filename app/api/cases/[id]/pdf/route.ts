import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import CaseSummaryPDF from '@/lib/pdf/CaseSummaryPDF'
import React from 'react'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const c = await prisma.case.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      customerInsurance: true,
      thirdPartyInsurance: true,
      internal: true,
    },
  })

  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const generatedAt = new Date().toLocaleDateString('el-CY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const caseData = {
    plate: c.plate,
    model: c.model,
    brand: c.brand,
    mileage: c.mileage,
    entryDate: c.entryDate.toISOString(),
    vehicleRegistrationDate: c.vehicleRegistrationDate?.toISOString() ?? null,
    notes: c.notes,
    status: c.status,
    owner: c.owner
      ? { name: c.owner.name, phone: c.owner.phone, address: c.owner.address }
      : null,
    customerInsurance: c.customerInsurance
      ? {
          company: c.customerInsurance.company,
          phone: c.customerInsurance.phone,
          email: c.customerInsurance.email,
          officer: c.customerInsurance.officer,
          estimator: c.customerInsurance.estimator,
          caseNumber: c.customerInsurance.caseNumber,
        }
      : null,
    thirdPartyInsurance: c.thirdPartyInsurance
      ? {
          company: c.thirdPartyInsurance.company,
          phone: c.thirdPartyInsurance.phone,
          email: c.thirdPartyInsurance.email,
          officer: c.thirdPartyInsurance.officer,
          estimator: c.thirdPartyInsurance.estimator,
          caseNumber: c.thirdPartyInsurance.caseNumber,
        }
      : null,
    internal: c.internal
      ? {
          estimateNumber: c.internal.estimateNumber,
          invoiceNumber: c.internal.invoiceNumber,
          sentForPaymentDate: c.internal.sentForPaymentDate?.toISOString() ?? null,
          paymentDetails: c.internal.paymentDetails,
        }
      : null,
  }

  const buffer = await renderToBuffer(
    React.createElement(CaseSummaryPDF, { c: caseData, generatedAt }) as React.ReactElement<any>
  )

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="case-${c.plate}-summary.pdf"`,
    },
  })
}
