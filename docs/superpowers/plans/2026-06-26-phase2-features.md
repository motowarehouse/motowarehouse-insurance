# Phase 2 Features — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Contacts Directory, Quick Notes, Message Templates, Case Summary PDF, Dashboard Charts, and Advanced Filters to the Motowarehouse insurance case management app.

**Architecture:** All features extend the existing Next.js 14 App Router app with Prisma/PostgreSQL. New Prisma models (InsuranceCompany, Officer, Estimator) underpin the Contacts Directory. PDF generation uses `@react-pdf/renderer` server-side. Charts use `recharts` client-side. Filters use URL search params for shareability.

**Tech Stack:** Next.js 14 App Router, Prisma 5, PostgreSQL, Tailwind CSS, Recharts, @react-pdf/renderer, Zod, React Hook Form, Lucide React

---

## File Map

**New files:**
- `prisma/schema.prisma` — updated with 4 new models
- `app/api/contacts/companies/route.ts` — GET list, POST create
- `app/api/contacts/companies/[id]/route.ts` — GET, PUT, DELETE
- `app/api/contacts/officers/route.ts` — GET list, POST create
- `app/api/contacts/officers/[id]/route.ts` — GET, PUT, DELETE
- `app/api/contacts/estimators/route.ts` — GET list, POST create
- `app/api/contacts/estimators/[id]/route.ts` — GET, PUT, DELETE
- `app/api/cases/[id]/notes/route.ts` — POST add note
- `app/api/cases/[id]/pdf/route.ts` — GET generate PDF
- `app/(dashboard)/contacts/page.tsx` — contacts directory page
- `components/contacts/ContactsClient.tsx` — tabs + modals (client)
- `lib/pdf/CaseSummaryPDF.tsx` — @react-pdf/renderer document
- `public/fonts/Lato-Regular.ttf` — font for PDF (downloaded)
- `public/fonts/Lato-Bold.ttf`
- `public/fonts/Lato-Black.ttf`
- `public/fonts/Lato-Light.ttf`
- `components/cases/QuickNote.tsx` — quick note form (client)
- `components/cases/MessageTemplates.tsx` — copy-to-clipboard templates (client)
- `components/dashboard/StatusChart.tsx` — cases by status chart
- `components/dashboard/MonthlyChart.tsx` — monthly intake chart
- `components/dashboard/FilterPanel.tsx` — advanced filter panel (client)

**Modified files:**
- `prisma/schema.prisma` — new models + FK fields on CustomerInsurance/ThirdPartyInsurance
- `components/layout/Sidebar.tsx` — add Contacts nav link
- `components/cases/CaseForm.tsx` — contacts-aware dropdowns
- `app/(dashboard)/cases/[id]/page.tsx` — add QuickNote, MessageTemplates, PDF button
- `app/(dashboard)/page.tsx` — add chart data + pass to charts
- `components/dashboard/CasesTableClient.tsx` — integrate FilterPanel + URL params

---

## Task 1: Install Dependencies + Download Fonts

**Files:**
- `package.json` (modified)
- `public/fonts/` (new directory with 4 TTF files)

- [ ] **Step 1: Install recharts and @react-pdf/renderer**

```bash
cd "C:\Users\MWH-HP2\Desktop\CLAUDE COWORK PROJECT NIKOLAS\motonikolas-cowork-project\insurance-app"
npm install recharts @react-pdf/renderer
npm install --save-dev @types/react-pdf
```

Expected output: packages added, no errors.

- [ ] **Step 2: Download Lato fonts for PDF generation**

Create `public/fonts/` directory, then download the 4 Lato TTF files from Google Fonts:

```bash
mkdir -p public/fonts
curl -o public/fonts/Lato-Regular.ttf "https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXg.ttf"
curl -o public/fonts/Lato-Bold.ttf "https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwiPHA.ttf"
curl -o public/fonts/Lato-Black.ttf "https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh50XSwiPHA.ttf"
curl -o public/fonts/Lato-Light.ttf "https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh7UVSwiPHA.ttf"
```

> **Windows CMD alternative:** Download the 4 files manually from https://fonts.google.com/specimen/Lato → Download family → extract Regular, Bold, Black, Light TTF files into `public/fonts/`

- [ ] **Step 3: Verify build still compiles**

```bash
npm run build
```

Expected: build succeeds. If `@types/react-pdf` not found, skip that line — it's optional.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json public/fonts/
git commit -m "deps: add recharts, @react-pdf/renderer, Lato fonts"
```

---

## Task 2: Prisma Schema — New Models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update schema.prisma**

Replace the full contents of `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Brand {
  SYM
  CFMOTO
  OTHER
}

enum Status {
  INTAKE
  AWAITING_ESTIMATOR
  ESTIMATOR_VISIT
  QUOTE_SENT
  QUOTE_APPROVED
  AWAITING_AUTHORIZATION
  AUTHORIZED
  IN_REPAIR
  COMPLETED
  REJECTED
  ON_HOLD
}

model Case {
  id                      String    @id @default(cuid())
  plate                   String    @unique
  entryDate               DateTime  @default(now())
  brand                   Brand
  model                   String
  mileage                 Int?
  vehicleRegistrationDate DateTime?
  status                  Status    @default(INTAKE)
  statusChangedAt         DateTime  @default(now())
  notes                   String?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  owner               Owner?
  customerInsurance   CustomerInsurance?
  thirdPartyInsurance ThirdPartyInsurance?
  internal            InternalData?
  files               CaseFile[]
  activities          Activity[]
}

model Owner {
  id      String  @id @default(cuid())
  caseId  String  @unique
  case    Case    @relation(fields: [caseId], references: [id], onDelete: Cascade)
  name    String?
  address String?
  phone   String?
}

model CustomerInsurance {
  id          String            @id @default(cuid())
  caseId      String            @unique
  case        Case              @relation(fields: [caseId], references: [id], onDelete: Cascade)
  company     String?
  phone       String?
  email       String?
  estimator   String?
  officer     String?
  caseNumber  String?
  companyRef  InsuranceCompany? @relation("CustCompany", fields: [companyId], references: [id], onDelete: SetNull)
  companyId   String?
  officerRef  Officer?          @relation("CustOfficer", fields: [officerId], references: [id], onDelete: SetNull)
  officerId   String?
  estimatorRef Estimator?       @relation("CustEstimator", fields: [estimatorId], references: [id], onDelete: SetNull)
  estimatorId String?
}

model ThirdPartyInsurance {
  id          String            @id @default(cuid())
  caseId      String            @unique
  case        Case              @relation(fields: [caseId], references: [id], onDelete: Cascade)
  company     String?
  phone       String?
  email       String?
  estimator   String?
  officer     String?
  caseNumber  String?
  companyRef  InsuranceCompany? @relation("TPCompany", fields: [companyId], references: [id], onDelete: SetNull)
  companyId   String?
  officerRef  Officer?          @relation("TPOfficer", fields: [officerId], references: [id], onDelete: SetNull)
  officerId   String?
  estimatorRef Estimator?       @relation("TPEstimator", fields: [estimatorId], references: [id], onDelete: SetNull)
  estimatorId String?
}

model InternalData {
  id                 String    @id @default(cuid())
  caseId             String    @unique
  case               Case      @relation(fields: [caseId], references: [id], onDelete: Cascade)
  estimateNumber     String?
  invoiceNumber      String?
  sentForPaymentDate DateTime?
  paymentDetails     String?
}

model CaseFile {
  id         String   @id @default(cuid())
  caseId     String
  case       Case     @relation(fields: [caseId], references: [id], onDelete: Cascade)
  url        String
  r2Key      String
  name       String
  mimeType   String
  size       Int?
  uploadedAt DateTime @default(now())
}

model Activity {
  id        String   @id @default(cuid())
  caseId    String
  case      Case     @relation(fields: [caseId], references: [id], onDelete: Cascade)
  action    String
  details   String?
  createdAt DateTime @default(now())
}

model InsuranceCompany {
  id                   String               @id @default(cuid())
  name                 String
  phone                String?
  email                String?
  notes                String?
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  officers             Officer[]
  estimatorLinks       EstimatorCompany[]
  customerInsurances   CustomerInsurance[]  @relation("CustCompany")
  thirdPartyInsurances ThirdPartyInsurance[] @relation("TPCompany")
}

model Officer {
  id                   String               @id @default(cuid())
  name                 String
  phone                String?
  email                String?
  companyId            String
  company              InsuranceCompany     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  customerInsurances   CustomerInsurance[]  @relation("CustOfficer")
  thirdPartyInsurances ThirdPartyInsurance[] @relation("TPOfficer")
}

model Estimator {
  id                   String               @id @default(cuid())
  name                 String
  phone                String?
  email                String?
  notes                String?
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  companyLinks         EstimatorCompany[]
  customerInsurances   CustomerInsurance[]  @relation("CustEstimator")
  thirdPartyInsurances ThirdPartyInsurance[] @relation("TPEstimator")
}

model EstimatorCompany {
  estimatorId String
  companyId   String
  estimator   Estimator        @relation(fields: [estimatorId], references: [id], onDelete: Cascade)
  company     InsuranceCompany @relation(fields: [companyId], references: [id], onDelete: Cascade)
  @@id([estimatorId, companyId])
}
```

- [ ] **Step 2: Push schema to database**

```bash
npx prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add InsuranceCompany, Officer, Estimator models + FK links to insurance records"
```

---

## Task 3: Contacts API Routes

**Files:**
- Create: `app/api/contacts/companies/route.ts`
- Create: `app/api/contacts/companies/[id]/route.ts`
- Create: `app/api/contacts/officers/route.ts`
- Create: `app/api/contacts/officers/[id]/route.ts`
- Create: `app/api/contacts/estimators/route.ts`
- Create: `app/api/contacts/estimators/[id]/route.ts`

- [ ] **Step 1: Create companies list + create route**

Create `app/api/contacts/companies/route.ts`:

```typescript
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
```

- [ ] **Step 2: Create company detail route (GET/PUT/DELETE)**

Create `app/api/contacts/companies/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const company = await prisma.insuranceCompany.findUnique({
    where: { id: params.id },
    include: { officers: true, estimatorLinks: { include: { estimator: true } } },
  })
  if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(company)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, phone, email, notes } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const company = await prisma.insuranceCompany.update({
    where: { id: params.id },
    data: { name: name.trim(), phone: phone || null, email: email || null, notes: notes || null },
  })
  return NextResponse.json(company)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.insuranceCompany.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Create officers list + create route**

Create `app/api/contacts/officers/route.ts`:

```typescript
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
```

- [ ] **Step 4: Create officer detail route**

Create `app/api/contacts/officers/[id]/route.ts`:

```typescript
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
```

- [ ] **Step 5: Create estimators list + create route**

Create `app/api/contacts/estimators/route.ts`:

```typescript
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
```

- [ ] **Step 6: Create estimator detail route**

Create `app/api/contacts/estimators/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, phone, email, notes, companyIds } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  // Replace company links
  await prisma.estimatorCompany.deleteMany({ where: { estimatorId: params.id } })

  const estimator = await prisma.estimator.update({
    where: { id: params.id },
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
  return NextResponse.json(estimator)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.estimator.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 7: Verify routes compile**

```bash
npm run build
```

Expected: no TypeScript errors on the new routes.

- [ ] **Step 8: Commit**

```bash
git add app/api/contacts/
git commit -m "feat: contacts API routes for companies, officers, estimators"
```

---

## Task 4: Contacts Directory Page + Sidebar Link

**Files:**
- Create: `app/(dashboard)/contacts/page.tsx`
- Create: `components/contacts/ContactsClient.tsx`
- Modify: `components/layout/Sidebar.tsx`

- [ ] **Step 1: Add Contacts link to Sidebar**

In `components/layout/Sidebar.tsx`, update the `NAV` array:

```typescript
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  Wrench,
  ChevronRight,
  BookUser,  // add this
} from 'lucide-react'

const NAV = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/cases/new', icon: PlusCircle, label: 'New Case' },
  { href: '/contacts', icon: BookUser, label: 'Contacts' },  // add this
]
```

- [ ] **Step 2: Create the contacts server page**

Create `app/(dashboard)/contacts/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma'
import ContactsClient from '@/components/contacts/ContactsClient'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const [companies, officers, estimators] = await Promise.all([
    prisma.insuranceCompany.findMany({
      include: { officers: true, _count: { select: { estimatorLinks: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.officer.findMany({
      include: { company: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.estimator.findMany({
      include: { companyLinks: { include: { company: { select: { id: true, name: true } } } } },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-brand-navy">Contacts / Επαφές</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Insurance companies, officers, and estimators
        </p>
      </div>
      <ContactsClient
        initialCompanies={companies}
        initialOfficers={officers}
        initialEstimators={estimators}
      />
    </div>
  )
}
```

- [ ] **Step 3: Create ContactsClient component**

Create `components/contacts/ContactsClient.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Building2, User, Users } from 'lucide-react'

type Company = { id: string; name: string; phone: string | null; email: string | null; notes: string | null; officers: Officer[]; _count: { estimatorLinks: number } }
type Officer = { id: string; name: string; phone: string | null; email: string | null; companyId: string; company: { id: string; name: string } }
type Estimator = { id: string; name: string; phone: string | null; email: string | null; notes: string | null; companyLinks: { company: { id: string; name: string } }[] }

interface Props {
  initialCompanies: Company[]
  initialOfficers: Officer[]
  initialEstimators: Estimator[]
}

type Tab = 'companies' | 'officers' | 'estimators'
type ModalState =
  | { type: 'company'; item?: Company }
  | { type: 'officer'; item?: Officer }
  | { type: 'estimator'; item?: Estimator }
  | null

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <span className="font-bold text-brand-navy">{title}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default function ContactsClient({ initialCompanies, initialOfficers, initialEstimators }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('companies')
  const [modal, setModal] = useState<ModalState>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [form, setForm] = useState<Record<string, any>>({})

  const tabs: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: 'companies', label: 'Companies', icon: Building2, count: initialCompanies.length },
    { key: 'officers', label: 'Officers', icon: User, count: initialOfficers.length },
    { key: 'estimators', label: 'Estimators', icon: Users, count: initialEstimators.length },
  ]

  function openAdd(type: Tab) {
    setForm({})
    setError('')
    setModal({ type } as ModalState)
  }

  function openEdit(type: Tab, item: any) {
    setError('')
    if (type === 'company') setForm({ name: item.name, phone: item.phone || '', email: item.email || '', notes: item.notes || '' })
    if (type === 'officer') setForm({ name: item.name, phone: item.phone || '', email: item.email || '', companyId: item.companyId })
    if (type === 'estimator') setForm({ name: item.name, phone: item.phone || '', email: item.email || '', notes: item.notes || '', companyIds: item.companyLinks.map((l: any) => l.company.id) })
    setModal({ type, item } as ModalState)
  }

  async function handleDelete(type: Tab, id: string) {
    if (!confirm('Are you sure?')) return
    const url = `/api/contacts/${type === 'companies' ? 'companies' : type === 'officers' ? 'officers' : 'estimators'}/${id}`
    await fetch(url, { method: 'DELETE' })
    router.refresh()
  }

  async function handleSave() {
    if (!modal) return
    setSaving(true)
    setError('')
    try {
      const isEdit = 'item' in modal && modal.item
      const base = `/api/contacts/${modal.type === 'company' ? 'companies' : modal.type === 'officer' ? 'officers' : 'estimators'}`
      const url = isEdit ? `${base}/${(modal.item as any).id}` : base
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { const e = await res.json(); setError(e.error || 'Error'); setSaving(false); return }
      setModal(null)
      router.refresh()
    } catch { setError('Network error') } finally { setSaving(false) }
  }

  const Field = ({ label, name, type = 'text', placeholder = '' }: { label: string; name: string; type?: string; placeholder?: string }) => (
    <div className="mb-4">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={form[name] || ''}
        onChange={e => setForm((f: any) => ({ ...f, [name]: e.target.value }))}
        placeholder={placeholder}
        className="input-base"
      />
    </div>
  )

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-brand-teal text-white' : 'bg-white text-gray-500 hover:text-brand-navy border border-gray-200'
            }`}
          >
            <t.icon size={14} />
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">
            {tab === 'companies' ? 'Insurance Companies' : tab === 'officers' ? 'Officers / Handlers' : 'Estimators'}
          </span>
          <button
            onClick={() => openAdd(tab)}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:text-brand-navy transition-colors"
          >
            <Plus size={13} /> Add
          </button>
        </div>

        {/* Companies */}
        {tab === 'companies' && (
          <table className="w-full text-sm">
            <thead className="bg-brand-navy text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Phone</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Officers</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {initialCompanies.map((c, i) => (
                <tr key={c.id} className={i % 2 === 1 ? 'bg-brand-row-tint' : ''}>
                  <td className="px-4 py-3 font-semibold text-brand-navy">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.officers.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit('companies' as any, c)} className="text-gray-400 hover:text-brand-teal"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete('companies', c.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialCompanies.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No companies yet</td></tr>}
            </tbody>
          </table>
        )}

        {/* Officers */}
        {tab === 'officers' && (
          <table className="w-full text-sm">
            <thead className="bg-brand-navy text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Company</th>
                <th className="text-left px-4 py-2">Phone</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {initialOfficers.map((o, i) => (
                <tr key={o.id} className={i % 2 === 1 ? 'bg-brand-row-tint' : ''}>
                  <td className="px-4 py-3 font-semibold text-brand-navy">{o.name}</td>
                  <td className="px-4 py-3 text-gray-500">{o.company.name}</td>
                  <td className="px-4 py-3 text-gray-500">{o.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{o.email || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit('officers' as any, o)} className="text-gray-400 hover:text-brand-teal"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete('officers', o.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialOfficers.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No officers yet</td></tr>}
            </tbody>
          </table>
        )}

        {/* Estimators */}
        {tab === 'estimators' && (
          <table className="w-full text-sm">
            <thead className="bg-brand-navy text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Companies</th>
                <th className="text-left px-4 py-2">Phone</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {initialEstimators.map((e, i) => (
                <tr key={e.id} className={i % 2 === 1 ? 'bg-brand-row-tint' : ''}>
                  <td className="px-4 py-3 font-semibold text-brand-navy">{e.name}</td>
                  <td className="px-4 py-3 text-gray-500">{e.companyLinks.map(l => l.company.name).join(', ') || 'Independent'}</td>
                  <td className="px-4 py-3 text-gray-500">{e.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{e.email || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit('estimators' as any, e)} className="text-gray-400 hover:text-brand-teal"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete('estimators', e.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialEstimators.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No estimators yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'company' && (
        <Modal title={(modal as any).item ? 'Edit Company' : 'Add Company'} onClose={() => setModal(null)}>
          <Field label="Company Name *" name="name" placeholder="e.g. COSMOS Insurance" />
          <Field label="Phone" name="phone" placeholder="22 xxxxxx" />
          <Field label="Email" name="email" type="email" placeholder="info@company.com" />
          <Field label="Notes" name="notes" placeholder="Optional notes" />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button onClick={handleSave} disabled={saving} className="w-full py-2.5 bg-brand-teal text-white font-bold rounded-lg hover:bg-brand-navy transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </Modal>
      )}

      {modal?.type === 'officer' && (
        <Modal title={(modal as any).item ? 'Edit Officer' : 'Add Officer'} onClose={() => setModal(null)}>
          <Field label="Full Name *" name="name" placeholder="e.g. Ειρήνη Παπαδοπούλου" />
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Company *</label>
            <select value={form.companyId || ''} onChange={e => setForm((f: any) => ({ ...f, companyId: e.target.value }))} className="input-base">
              <option value="">Select company…</option>
              {initialCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Field label="Phone" name="phone" placeholder="99 xxxxxx" />
          <Field label="Email" name="email" type="email" placeholder="officer@company.com" />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button onClick={handleSave} disabled={saving} className="w-full py-2.5 bg-brand-teal text-white font-bold rounded-lg hover:bg-brand-navy transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </Modal>
      )}

      {modal?.type === 'estimator' && (
        <Modal title={(modal as any).item ? 'Edit Estimator' : 'Add Estimator'} onClose={() => setModal(null)}>
          <Field label="Full Name *" name="name" placeholder="e.g. Κωνσταντίνος Τελεβάντος" />
          <Field label="Phone" name="phone" placeholder="99 xxxxxx" />
          <Field label="Email" name="email" type="email" placeholder="estimator@email.com" />
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Linked Companies (optional)</label>
            <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {initialCompanies.map(c => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={(form.companyIds || []).includes(c.id)}
                    onChange={e => {
                      const ids = form.companyIds || []
                      setForm((f: any) => ({ ...f, companyIds: e.target.checked ? [...ids, c.id] : ids.filter((i: string) => i !== c.id) }))
                    }}
                    className="accent-brand-teal"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <Field label="Notes" name="notes" placeholder="Optional notes" />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button onClick={handleSave} disabled={saving} className="w-full py-2.5 bg-brand-teal text-white font-bold rounded-lg hover:bg-brand-navy transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </Modal>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify — visit /contacts in browser**

Navigate to `http://localhost:3000/contacts`. You should see three tabs (Companies, Officers, Estimators), each with an Add button and an empty table. Add one company, one officer linked to that company, and one estimator. Verify they appear in the list and can be edited/deleted.

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/contacts/ components/contacts/ components/layout/Sidebar.tsx
git commit -m "feat: contacts directory page with companies, officers, estimators"
```

---

## Task 5: Case Form Integration with Contacts

**Files:**
- Modify: `components/cases/CaseForm.tsx`

The goal: replace freehand text inputs for company/officer/estimator with smart dropdowns that fetch from the contacts directory. Text fields are preserved as the data source of truth — selecting from the directory populates the text fields AND stores the FK reference.

- [ ] **Step 1: Update CaseForm.tsx**

Replace `components/cases/CaseForm.tsx` with:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Bike, User, Shield, Building2, FileText, Save, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

const CaseSchema = z.object({
  plate: z.string().min(1, 'Plate is required'),
  entryDate: z.string().min(1, 'Entry date is required'),
  brand: z.enum(['SYM', 'CFMOTO', 'OTHER']),
  model: z.string().min(1, 'Model is required'),
  mileage: z.string().optional(),
  vehicleRegistrationDate: z.string().optional(),
  notes: z.string().optional(),
  ownerName: z.string().optional(),
  ownerAddress: z.string().optional(),
  ownerPhone: z.string().optional(),
  custCompany: z.string().optional(),
  custPhone: z.string().optional(),
  custEmail: z.string().optional(),
  custEstimator: z.string().optional(),
  custOfficer: z.string().optional(),
  custCaseNumber: z.string().optional(),
  tpCompany: z.string().optional(),
  tpPhone: z.string().optional(),
  tpEmail: z.string().optional(),
  tpEstimator: z.string().optional(),
  tpOfficer: z.string().optional(),
  tpCaseNumber: z.string().optional(),
  estimateNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
  sentForPaymentDate: z.string().optional(),
  paymentDetails: z.string().optional(),
})

type CaseFormData = z.infer<typeof CaseSchema>

interface CaseFormProps {
  defaultValues?: Partial<CaseFormData>
  caseId?: string
  isEdit?: boolean
}

type Company = { id: string; name: string; phone: string | null; email: string | null; officers: { id: string; name: string; phone: string | null; email: string | null }[] }
type Estimator = { id: string; name: string; phone: string | null; email: string | null }

function SectionHeader({ icon: Icon, title, titleGr }: { icon: any; title: string; titleGr: string }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-brand-navy rounded-t-xl">
      <Icon size={15} className="text-brand-teal" />
      <div>
        <span className="text-white font-bold text-sm tracking-wide">{title}</span>
        <span className="text-brand-teal-pale font-light text-xs ml-2">/ {titleGr}</span>
      </div>
    </div>
  )
}

function Field({ label, labelGr, children }: { label: string; labelGr: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
        {label} <span className="text-gray-400 font-light normal-case tracking-normal">/ {labelGr}</span>
      </label>
      {children}
    </div>
  )
}

export default function CaseForm({ defaultValues, caseId, isEdit = false }: CaseFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Contacts directory state
  const [companies, setCompanies] = useState<Company[]>([])
  const [estimators, setEstimators] = useState<Estimator[]>([])
  const [selectedCustCompanyId, setSelectedCustCompanyId] = useState('')
  const [selectedTpCompanyId, setSelectedTpCompanyId] = useState('')
  const [custEstimatorId, setCustEstimatorId] = useState('')
  const [tpEstimatorId, setTpEstimatorId] = useState('')
  const [custOfficerId, setCustOfficerId] = useState('')
  const [tpOfficerId, setTpOfficerId] = useState('')

  useEffect(() => {
    fetch('/api/contacts/companies').then(r => r.json()).then(setCompanies).catch(() => {})
    fetch('/api/contacts/estimators').then(r => r.json()).then(setEstimators).catch(() => {})
  }, [])

  const custOfficers = companies.find(c => c.id === selectedCustCompanyId)?.officers || []
  const tpOfficers = companies.find(c => c.id === selectedTpCompanyId)?.officers || []

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CaseFormData>({
    resolver: zodResolver(CaseSchema),
    defaultValues: {
      entryDate: format(new Date(), 'yyyy-MM-dd'),
      brand: 'SYM',
      ...defaultValues,
    },
  })

  function handleCustCompanySelect(companyId: string) {
    setSelectedCustCompanyId(companyId)
    setCustOfficerId('')
    const company = companies.find(c => c.id === companyId)
    if (company) {
      setValue('custCompany', company.name)
      setValue('custPhone', company.phone || '')
      setValue('custEmail', company.email || '')
    }
  }

  function handleCustOfficerSelect(officerId: string) {
    setCustOfficerId(officerId)
    const officer = custOfficers.find(o => o.id === officerId)
    if (officer) {
      setValue('custOfficer', officer.name)
      if (officer.phone) setValue('custPhone', officer.phone)
      if (officer.email) setValue('custEmail', officer.email)
    }
  }

  function handleTpCompanySelect(companyId: string) {
    setSelectedTpCompanyId(companyId)
    setTpOfficerId('')
    const company = companies.find(c => c.id === companyId)
    if (company) {
      setValue('tpCompany', company.name)
      setValue('tpPhone', company.phone || '')
      setValue('tpEmail', company.email || '')
    }
  }

  function handleTpOfficerSelect(officerId: string) {
    setTpOfficerId(officerId)
    const officer = tpOfficers.find(o => o.id === officerId)
    if (officer) {
      setValue('tpOfficer', officer.name)
      if (officer.phone) setValue('tpPhone', officer.phone)
      if (officer.email) setValue('tpEmail', officer.email)
    }
  }

  function handleCustEstimatorSelect(estimatorId: string) {
    setCustEstimatorId(estimatorId)
    const est = estimators.find(e => e.id === estimatorId)
    if (est) setValue('custEstimator', est.name)
  }

  function handleTpEstimatorSelect(estimatorId: string) {
    setTpEstimatorId(estimatorId)
    const est = estimators.find(e => e.id === estimatorId)
    if (est) setValue('tpEstimator', est.name)
  }

  async function onSubmit(data: CaseFormData) {
    setSubmitting(true)
    setError('')
    const payload = {
      plate: data.plate,
      entryDate: data.entryDate,
      brand: data.brand,
      model: data.model,
      mileage: data.mileage ? parseInt(data.mileage) : null,
      vehicleRegistrationDate: data.vehicleRegistrationDate || null,
      notes: data.notes || null,
      owner: { name: data.ownerName || null, address: data.ownerAddress || null, phone: data.ownerPhone || null },
      customerInsurance: {
        company: data.custCompany || null,
        phone: data.custPhone || null,
        email: data.custEmail || null,
        estimator: data.custEstimator || null,
        officer: data.custOfficer || null,
        caseNumber: data.custCaseNumber || null,
        companyId: selectedCustCompanyId || null,
        officerId: custOfficerId || null,
        estimatorId: custEstimatorId || null,
      },
      thirdPartyInsurance: {
        company: data.tpCompany || null,
        phone: data.tpPhone || null,
        email: data.tpEmail || null,
        estimator: data.tpEstimator || null,
        officer: data.tpOfficer || null,
        caseNumber: data.tpCaseNumber || null,
        companyId: selectedTpCompanyId || null,
        officerId: tpOfficerId || null,
        estimatorId: tpEstimatorId || null,
      },
      internal: {
        estimateNumber: data.estimateNumber || null,
        invoiceNumber: data.invoiceNumber || null,
        sentForPaymentDate: data.sentForPaymentDate || null,
        paymentDetails: data.paymentDetails || null,
      },
    }

    try {
      const url = isEdit ? `/api/cases/${caseId}` : '/api/cases'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const err = await res.json(); setError(err.error || 'Something went wrong.'); setSubmitting(false); return }
      const saved = await res.json()
      router.push(`/cases/${saved.id}`)
      router.refresh()
    } catch { setError('Network error. Please try again.'); setSubmitting(false) }
  }

  const selectClass = 'input-base bg-brand-teal/5 border-brand-teal/30'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

      {/* Vehicle */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader icon={Bike} title="Vehicle Details" titleGr="Στοιχεία Οχήματος" />
        <div className="p-5 grid grid-cols-3 gap-4">
          <Field label="Registration Plate" labelGr="Αρ. Εγγραφής">
            <input {...register('plate')} className="input-base uppercase" placeholder="e.g. TEA558" />
            {errors.plate && <p className="text-red-500 text-xs mt-1">{errors.plate.message}</p>}
          </Field>
          <Field label="Brand" labelGr="Μάρκα">
            <select {...register('brand')} className="input-base">
              <option value="SYM">SYM</option>
              <option value="CFMOTO">CFMOTO</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field label="Model" labelGr="Μοντέλο">
            <input {...register('model')} className="input-base" placeholder="e.g. JET X 125" />
            {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>}
          </Field>
          <Field label="Entry Date" labelGr="Ημ. Εισαγωγής">
            <input {...register('entryDate')} type="date" className="input-base" />
          </Field>
          <Field label="Mileage (km)" labelGr="Χιλιόμετρα">
            <input {...register('mileage')} type="number" className="input-base" placeholder="e.g. 12500" />
          </Field>
          <Field label="Vehicle Registration Date" labelGr="Ημ. Εγγραφής">
            <input {...register('vehicleRegistrationDate')} type="date" className="input-base" />
          </Field>
        </div>
      </div>

      {/* Owner */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader icon={User} title="Owner Details" titleGr="Στοιχεία Ιδιοκτήτη" />
        <div className="p-5 grid grid-cols-3 gap-4">
          <Field label="Full Name" labelGr="Ονομα">
            <input {...register('ownerName')} className="input-base" placeholder="Owner's full name" />
          </Field>
          <Field label="Phone" labelGr="Τηλέφωνο">
            <input {...register('ownerPhone')} className="input-base" placeholder="e.g. 99 123456" />
          </Field>
          <Field label="Address" labelGr="Διεύθυνση">
            <input {...register('ownerAddress')} className="input-base" placeholder="Address" />
          </Field>
        </div>
      </div>

      {/* Customer Insurance */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader icon={Shield} title="Customer's Insurance" titleGr="Ασφάλεια Πελάτη" />
        <div className="p-5 space-y-4">
          {companies.length > 0 && (
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-50">
              <div>
                <label className="block text-xs font-bold text-brand-teal uppercase tracking-wide mb-1">Quick Select Company</label>
                <select value={selectedCustCompanyId} onChange={e => handleCustCompanySelect(e.target.value)} className={selectClass}>
                  <option value="">— select from directory —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-teal uppercase tracking-wide mb-1">Quick Select Officer</label>
                <select value={custOfficerId} onChange={e => handleCustOfficerSelect(e.target.value)} disabled={!selectedCustCompanyId} className={selectClass}>
                  <option value="">— select officer —</option>
                  {custOfficers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Insurance Company" labelGr="Εταιρεία">
              <input {...register('custCompany')} className="input-base" placeholder="e.g. COSMOS" />
            </Field>
            <Field label="Phone" labelGr="Τηλέφωνο">
              <input {...register('custPhone')} className="input-base" placeholder="Insurance phone" />
            </Field>
            <Field label="Email" labelGr="Ηλεκτρονική Διεύθυνση">
              <input {...register('custEmail')} type="email" className="input-base" placeholder="Insurance email" />
            </Field>
            <Field label="Estimator" labelGr="Εκτιμητής">
              {estimators.length > 0 ? (
                <select value={custEstimatorId} onChange={e => handleCustEstimatorSelect(e.target.value)} className={selectClass}>
                  <option value="">— select or type below —</option>
                  {estimators.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              ) : null}
              <input {...register('custEstimator')} className="input-base mt-1" placeholder="Estimator name" />
            </Field>
            <Field label="Officer / Handler" labelGr="Λειτουργός">
              <input {...register('custOfficer')} className="input-base" placeholder="Officer name" />
            </Field>
            <Field label="Case Number" labelGr="Αρ. Υπόθεσης">
              <input {...register('custCaseNumber')} className="input-base" placeholder="Insurance case #" />
            </Field>
          </div>
        </div>
      </div>

      {/* Third Party Insurance */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader icon={Building2} title="Third Party Insurance" titleGr="Ασφάλεια Τρίτου" />
        <div className="p-5 space-y-4">
          {companies.length > 0 && (
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-50">
              <div>
                <label className="block text-xs font-bold text-brand-teal uppercase tracking-wide mb-1">Quick Select Company</label>
                <select value={selectedTpCompanyId} onChange={e => handleTpCompanySelect(e.target.value)} className={selectClass}>
                  <option value="">— select from directory —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-teal uppercase tracking-wide mb-1">Quick Select Officer</label>
                <select value={tpOfficerId} onChange={e => handleTpOfficerSelect(e.target.value)} disabled={!selectedTpCompanyId} className={selectClass}>
                  <option value="">— select officer —</option>
                  {tpOfficers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Insurance Company" labelGr="Εταιρεία">
              <input {...register('tpCompany')} className="input-base" placeholder="e.g. ANYTIME" />
            </Field>
            <Field label="Phone" labelGr="Τηλέφωνο">
              <input {...register('tpPhone')} className="input-base" placeholder="Insurance phone" />
            </Field>
            <Field label="Email" labelGr="Ηλεκτρονική Διεύθυνση">
              <input {...register('tpEmail')} type="email" className="input-base" placeholder="Insurance email" />
            </Field>
            <Field label="Estimator" labelGr="Εκτιμητής">
              {estimators.length > 0 ? (
                <select value={tpEstimatorId} onChange={e => handleTpEstimatorSelect(e.target.value)} className={selectClass}>
                  <option value="">— select or type below —</option>
                  {estimators.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              ) : null}
              <input {...register('tpEstimator')} className="input-base mt-1" placeholder="Estimator name" />
            </Field>
            <Field label="Officer / Handler" labelGr="Λειτουργός">
              <input {...register('tpOfficer')} className="input-base" placeholder="Officer name" />
            </Field>
            <Field label="Case Number" labelGr="Αρ. Υπόθεσης">
              <input {...register('tpCaseNumber')} className="input-base" placeholder="Insurance case #" />
            </Field>
          </div>
        </div>
      </div>

      {/* Internal */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader icon={FileText} title="Internal Use" titleGr="Για Εσωτερική Χρήση" />
        <div className="p-5 grid grid-cols-3 gap-4">
          <Field label="Estimate Number" labelGr="Αρ. Εκτίμησης">
            <input {...register('estimateNumber')} className="input-base" placeholder="Estimate #" />
          </Field>
          <Field label="Invoice Number" labelGr="Αρ. Τιμολογίου">
            <input {...register('invoiceNumber')} className="input-base" placeholder="Invoice #" />
          </Field>
          <Field label="Date Sent for Payment" labelGr="Ημ. Αποστολής για Πληρωμή">
            <input {...register('sentForPaymentDate')} type="date" className="input-base" />
          </Field>
          <div className="col-span-3">
            <Field label="Payment Details" labelGr="Λεπτομέρειες Πληρωμής">
              <textarea {...register('paymentDetails')} className="input-base resize-none" rows={3} placeholder="Payment notes, amounts, bank details…" />
            </Field>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Notes / Σημειώσεις</span>
        </div>
        <div className="p-5">
          <textarea {...register('notes')} className="input-base resize-none" rows={4} placeholder="Any additional notes…" />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-4">
        <button type="button" onClick={() => router.back()} className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-brand-teal hover:bg-brand-navy-mid text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50">
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Case'}
        </button>
      </div>
    </form>
  )
}
```

Also update the case API route to accept the new FK fields. In `app/api/cases/route.ts`, the POST handler's `customerInsurance` and `thirdPartyInsurance` Prisma create calls should include the new optional fields. Find the `create` call in the POST handler and update the nested insurance data to include `companyId`, `officerId`, `estimatorId` if provided:

```typescript
// In the POST handler inside app/api/cases/route.ts
// Find where customerInsurance is created and add:
customerInsurance: {
  create: {
    company: body.customerInsurance?.company || null,
    phone: body.customerInsurance?.phone || null,
    email: body.customerInsurance?.email || null,
    estimator: body.customerInsurance?.estimator || null,
    officer: body.customerInsurance?.officer || null,
    caseNumber: body.customerInsurance?.caseNumber || null,
    companyId: body.customerInsurance?.companyId || null,      // NEW
    officerId: body.customerInsurance?.officerId || null,      // NEW
    estimatorId: body.customerInsurance?.estimatorId || null,  // NEW
  },
},
// Same for thirdPartyInsurance
```

Do the same in `app/api/cases/[id]/route.ts` PUT handler for the update calls.

- [ ] **Step 2: Verify new case form works**

Open `http://localhost:3000/cases/new`. If you've added companies to the directory, you should see "Quick Select Company" dropdowns in the insurance sections. Selecting a company should auto-fill its phone/email. Create a test case and verify it saves correctly.

- [ ] **Step 3: Commit**

```bash
git add components/cases/CaseForm.tsx app/api/cases/route.ts app/api/cases/
git commit -m "feat: case form contacts integration — quick-select company/officer/estimator"
```

---

## Task 6: Quick Case Notes

**Files:**
- Create: `app/api/cases/[id]/notes/route.ts`
- Create: `components/cases/QuickNote.tsx`
- Modify: `app/(dashboard)/cases/[id]/page.tsx`

- [ ] **Step 1: Create notes API route**

Create `app/api/cases/[id]/notes/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { text } = body
  if (!text?.trim()) return NextResponse.json({ error: 'Note text is required' }, { status: 400 })

  await prisma.activity.create({
    data: {
      caseId: params.id,
      action: 'NOTE_ADDED',
      details: text.trim(),
    },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create QuickNote component**

Create `components/cases/QuickNote.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquarePlus, Loader2 } from 'lucide-react'

export default function QuickNote({ caseId }: { caseId: string }) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    await fetch(`/api/cases/${caseId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    setText('')
    setSaving(false)
    setFlash(true)
    setTimeout(() => setFlash(false), 2000)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">
          Add Note / Προσθήκη Σημείωσης
        </span>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a quick note… / Προσθήκη σημείωσης…"
          className="input-base resize-none"
          rows={3}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !text.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-teal hover:bg-brand-navy-mid text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <MessageSquarePlus size={13} />}
            {saving ? 'Saving…' : 'Save Note'}
          </button>
          {flash && <span className="text-xs text-green-600 font-semibold">✓ Note saved</span>}
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Add QuickNote to case detail page**

In `app/(dashboard)/cases/[id]/page.tsx`, import QuickNote and add it between FileUploadSection and ActivityLog:

```typescript
import QuickNote from '@/components/cases/QuickNote'

// In the JSX, after <FileUploadSection>:
<QuickNote caseId={c.id} />
<ActivityLog activities={c.activities} />
```

- [ ] **Step 4: Verify**

Open a case detail page. You should see a "Add Note" card above the activity log. Type a note, click Save Note, and it should appear in the activity log below immediately.

- [ ] **Step 5: Commit**

```bash
git add app/api/cases/[id]/notes/ components/cases/QuickNote.tsx app/(dashboard)/cases/[id]/page.tsx
git commit -m "feat: quick case notes — add note from case detail without full form edit"
```

---

## Task 7: Message Templates

**Files:**
- Create: `components/cases/MessageTemplates.tsx`
- Modify: `app/(dashboard)/cases/[id]/page.tsx`

- [ ] **Step 1: Create MessageTemplates component**

Create `components/cases/MessageTemplates.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Copy, Check, MessageCircle, Mail } from 'lucide-react'

interface Props {
  plate: string
  brand: string
  model: string
  estimatorName: string | null
  officerName: string | null
  insuranceCompany: string | null
  insuranceCaseNumber: string | null
  estimateNumber: string | null
}

function fill(value: string | null | undefined): string {
  return value?.trim() || '[—]'
}

export default function MessageTemplates({
  plate, brand, model, estimatorName, officerName,
  insuranceCompany, insuranceCaseNumber, estimateNumber,
}: Props) {
  const [copiedViber, setCopiedViber] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  const viberText = `Αγαπητέ/η ${fill(estimatorName)},

Σας αποστέλλουμε την προσφορά μας για το όχημα:
Πινακίδα: ${fill(plate)}
Όχημα: ${fill(brand)} ${fill(model)}
Αρ. Προσφοράς: ${fill(estimateNumber)}

Παρακαλούμε επιβεβαιώστε αν η προσφορά είναι αποδεκτή.

Motowarehouse Ltd — 22 328 788`

  const emailSubject = `Εξουσιοδότηση Επισκευής — ${fill(plate)}`

  const emailText = `Subject: ${emailSubject}

Καλημέρα ${fill(officerName)},

Αναφορικά με το ατύχημα με την μοτοσυκλέτα με αριθμό εγγραφής ${fill(plate)} παρακαλώ να μας ενημερώσετε για να προχωρήσουμε στην επιδιόρθωση με ευθύνη της ${fill(insuranceCompany)} σύμφωνα με την εκτίμηση του κ. ${fill(estimatorName)}.

Πινακίδα: ${fill(plate)}
Όχημα: ${fill(brand)} ${fill(model)}
Αρ. Υπόθεσης: ${fill(insuranceCaseNumber)}
Αρ. Εκτίμησης: ${fill(estimateNumber)}

Motowarehouse Ltd
support@motowarehouse.com.cy | Τηλ: 22 328 788`

  async function copy(text: string, which: 'viber' | 'email') {
    await navigator.clipboard.writeText(text)
    if (which === 'viber') { setCopiedViber(true); setTimeout(() => setCopiedViber(false), 2500) }
    else { setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2500) }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">
          Templates / Πρότυπα
        </span>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        {/* Viber */}
        <div className="border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={14} className="text-green-500" />
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Viber — Quote Approval</span>
          </div>
          <pre className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed mb-3">
            {viberText}
          </pre>
          <button
            onClick={() => copy(viberText, 'viber')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors w-full justify-center ${
              copiedViber ? 'bg-green-100 text-green-700' : 'bg-brand-teal/10 text-brand-teal hover:bg-brand-teal hover:text-white'
            }`}
          >
            {copiedViber ? <Check size={12} /> : <Copy size={12} />}
            {copiedViber ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Email */}
        <div className="border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={14} className="text-brand-teal" />
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Email — Authorization Request</span>
          </div>
          <pre className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed mb-3">
            {emailText}
          </pre>
          <button
            onClick={() => copy(emailText, 'email')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors w-full justify-center ${
              copiedEmail ? 'bg-green-100 text-green-700' : 'bg-brand-teal/10 text-brand-teal hover:bg-brand-teal hover:text-white'
            }`}
          >
            {copiedEmail ? <Check size={12} /> : <Copy size={12} />}
            {copiedEmail ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add MessageTemplates to case detail page**

In `app/(dashboard)/cases/[id]/page.tsx`, import and add the component. Add it after `CaseDetailSections`:

```typescript
import MessageTemplates from '@/components/cases/MessageTemplates'

// In JSX, after <CaseDetailSections c={c} />:
<MessageTemplates
  plate={c.plate}
  brand={c.brand}
  model={c.model}
  estimatorName={c.customerInsurance?.estimator || null}
  officerName={c.customerInsurance?.officer || null}
  insuranceCompany={c.customerInsurance?.company || null}
  insuranceCaseNumber={c.customerInsurance?.caseNumber || null}
  estimateNumber={c.internal?.estimateNumber || null}
/>
```

- [ ] **Step 3: Verify**

Open a case detail page. You should see a "Templates" card with two panels (Viber and Email). Click "Copy" on each — paste into Notepad to verify the text is correct and placeholders are filled from case data. Fields with no data show `[—]`.

- [ ] **Step 4: Commit**

```bash
git add components/cases/MessageTemplates.tsx app/(dashboard)/cases/[id]/page.tsx
git commit -m "feat: message templates — one-click copy for Viber quote and authorization email"
```

---

## Task 8: Dashboard Charts

**Files:**
- Create: `components/dashboard/StatusChart.tsx`
- Create: `components/dashboard/MonthlyChart.tsx`
- Modify: `app/(dashboard)/page.tsx`

- [ ] **Step 1: Create StatusChart component**

Create `components/dashboard/StatusChart.tsx`:

```typescript
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  data: { status: string; label: string; count: number; color: string }[]
}

export default function StatusChart({ data }: Props) {
  const filtered = data.filter(d => d.count > 0)

  if (filtered.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center justify-center h-48">
        <p className="text-sm text-gray-400">No active cases</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">Cases by Status</span>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={filtered} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11, fill: '#374151' }} />
            <Tooltip
              cursor={{ fill: '#f0f4f8' }}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(value: any) => [value, 'Cases']}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {filtered.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create MonthlyChart component**

Create `components/dashboard/MonthlyChart.tsx`:

```typescript
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { month: string; count: number }[]
}

export default function MonthlyChart({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">Monthly Intake (last 6 months)</span>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(value: any) => [value, 'Cases']}
            />
            <Bar dataKey="count" fill="#009BB4" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update dashboard page with chart data**

Replace `app/(dashboard)/page.tsx` with:

```typescript
import { prisma } from '@/lib/prisma'
import { getDaysInStatus } from '@/lib/utils'
import { TERMINAL_STATUSES, STATUS_CONFIG, WORKFLOW_STEPS } from '@/lib/constants'
import { startOfMonth, subMonths, format } from 'date-fns'
import StatsCards from '@/components/dashboard/StatsCards'
import CasesTableClient from '@/components/dashboard/CasesTableClient'
import StatusChart from '@/components/dashboard/StatusChart'
import MonthlyChart from '@/components/dashboard/MonthlyChart'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const now = new Date()
  const monthStart = startOfMonth(now)

  const allCases = await prisma.case.findMany({
    include: {
      owner: { select: { name: true } },
      customerInsurance: { select: { company: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const activeCases = allCases.filter(c => !TERMINAL_STATUSES.includes(c.status as any)).length
  const inRepair = allCases.filter(c => c.status === 'IN_REPAIR').length
  const awaitingAuth = allCases.filter(c => c.status === 'AWAITING_AUTHORIZATION').length
  const completedThisMonth = allCases.filter(c => c.status === 'COMPLETED' && new Date(c.updatedAt) >= monthStart).length
  const overdueCount = allCases.filter(c => {
    if (TERMINAL_STATUSES.includes(c.status as any)) return false
    return getDaysInStatus(c.statusChangedAt) > 14
  }).length

  // Status chart data — active statuses only
  const statusChartData = WORKFLOW_STEPS.map(status => {
    const cfg = STATUS_CONFIG[status]
    const count = allCases.filter(c => c.status === status).length
    // Map status config color class to a hex color
    const colorMap: Record<string, string> = {
      INTAKE: '#6b7280',
      AWAITING_ESTIMATOR: '#f59e0b',
      ESTIMATOR_VISIT: '#8b5cf6',
      QUOTE_SENT: '#3b82f6',
      QUOTE_APPROVED: '#06b6d4',
      AWAITING_AUTHORIZATION: '#f97316',
      AUTHORIZED: '#10b981',
      IN_REPAIR: '#009BB4',
      COMPLETED: '#22c55e',
    }
    return { status, label: cfg.labelGr, count, color: colorMap[status] || '#009BB4' }
  })

  // Monthly intake — last 6 months
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i)
    const start = startOfMonth(d)
    const end = startOfMonth(subMonths(d, -1))
    const count = allCases.filter(c => {
      const created = new Date(c.createdAt)
      return created >= start && created < end
    }).length
    return { month: format(d, 'MMM'), count }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-navy">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {allCases.length} total case{allCases.length !== 1 ? 's' : ''} · All insurance claims
          </p>
        </div>
      </div>

      <StatsCards stats={{ activeCases, inRepair, awaitingAuth, completedThisMonth, overdueCount }} />

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <StatusChart data={statusChartData} />
        <MonthlyChart data={monthlyData} />
      </div>

      <CasesTableClient initialCases={allCases} />
    </div>
  )
}
```

- [ ] **Step 4: Verify charts render**

Open `http://localhost:3000`. Below the stats cards you should see two chart cards side by side. With no cases the status chart shows "No active cases". Create a couple of test cases to see bars appear.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/StatusChart.tsx components/dashboard/MonthlyChart.tsx app/(dashboard)/page.tsx
git commit -m "feat: dashboard charts — cases by status and monthly intake"
```

---

## Task 9: Advanced Filters

**Files:**
- Create: `components/dashboard/FilterPanel.tsx`
- Modify: `components/dashboard/CasesTableClient.tsx`

- [ ] **Step 1: Create FilterPanel component**

Create `components/dashboard/FilterPanel.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

interface FilterValues {
  dateFrom: string
  dateTo: string
  company: string
  estimator: string
  brand: string
}

interface Props {
  filters: FilterValues
  companies: string[]
  estimators: string[]
  onChange: (filters: FilterValues) => void
}

const empty: FilterValues = { dateFrom: '', dateTo: '', company: '', estimator: '', brand: '' }

export default function FilterPanel({ filters, companies, estimators, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const activeCount = Object.values(filters).filter(Boolean).length

  function clear() { onChange(empty) }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
          activeCount > 0
            ? 'bg-brand-teal text-white border-brand-teal'
            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
        }`}
      >
        <SlidersHorizontal size={14} />
        Filters
        {activeCount > 0 && (
          <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{activeCount}</span>
        )}
      </button>

      {open && (
        <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-md p-4 grid grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">From</label>
            <input type="date" value={filters.dateFrom} onChange={e => onChange({ ...filters, dateFrom: e.target.value })} className="input-base" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">To</label>
            <input type="date" value={filters.dateTo} onChange={e => onChange({ ...filters, dateTo: e.target.value })} className="input-base" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Company</label>
            <select value={filters.company} onChange={e => onChange({ ...filters, company: e.target.value })} className="input-base">
              <option value="">All</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Estimator</label>
            <select value={filters.estimator} onChange={e => onChange({ ...filters, estimator: e.target.value })} className="input-base">
              <option value="">All</option>
              {estimators.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Brand</label>
            <select value={filters.brand} onChange={e => onChange({ ...filters, brand: e.target.value })} className="input-base">
              <option value="">All</option>
              <option value="SYM">SYM</option>
              <option value="CFMOTO">CFMOTO</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          {activeCount > 0 && (
            <div className="col-span-5 flex justify-end">
              <button onClick={clear} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors">
                <X size={12} /> Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Read current CasesTableClient to understand structure before modifying**

Read `components/dashboard/CasesTableClient.tsx` and update it to integrate FilterPanel. Add these imports and update the filtering logic:

```typescript
'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { STATUS_CONFIG, TERMINAL_STATUSES } from '@/lib/constants'
import { getDaysInStatus, getAgeColor, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/cases/StatusBadge'
import AgeIndicator from '@/components/cases/AgeIndicator'
import FilterPanel from '@/components/dashboard/FilterPanel'

// (keep existing Case type and TABS array)

export default function CasesTableClient({ initialCases }: { initialCases: CaseWithRelations[] }) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', company: '', estimator: '', brand: '' })

  // Build filter dropdown options from data
  const companies = useMemo(() => {
    const set = new Set<string>()
    initialCases.forEach(c => { if (c.customerInsurance?.company) set.add(c.customerInsurance.company) })
    return Array.from(set).sort()
  }, [initialCases])

  const estimators = useMemo(() => {
    const set = new Set<string>()
    // estimator field is on customerInsurance
    initialCases.forEach(c => {
      // We need to include the estimator field — update the include in page.tsx if needed
    })
    return Array.from(set).sort()
  }, [initialCases])

  const filtered = useMemo(() => {
    return initialCases.filter(c => {
      // Search
      if (search) {
        const q = search.toLowerCase()
        const matches =
          c.plate.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q) ||
          c.owner?.name?.toLowerCase().includes(q) ||
          c.customerInsurance?.company?.toLowerCase().includes(q)
        if (!matches) return false
      }
      // Status tab
      if (activeTab !== 'all' && c.status !== activeTab) return false
      // Date from
      if (filters.dateFrom && new Date(c.entryDate) < new Date(filters.dateFrom)) return false
      // Date to
      if (filters.dateTo && new Date(c.entryDate) > new Date(filters.dateTo)) return false
      // Company
      if (filters.company && c.customerInsurance?.company !== filters.company) return false
      // Brand
      if (filters.brand && c.brand !== filters.brand) return false
      return true
    })
  }, [initialCases, search, activeTab, filters])

  // ... keep rest of the existing render JSX, just add FilterPanel in the toolbar area:
  // <div className="flex items-center gap-3">
  //   <Search ... />
  //   <FilterPanel filters={filters} companies={companies} estimators={estimators} onChange={setFilters} />
  // </div>
}
```

> **Note:** The estimator filter requires including the `customerInsurance.estimator` field in the dashboard page query. Update `app/(dashboard)/page.tsx` to include `customerInsurance: { select: { company: true, estimator: true } }` in the Prisma query.

- [ ] **Step 3: Verify filters work**

Open the dashboard. Click the "Filters" button — a filter row should expand. Set a brand filter to "SYM" — only SYM cases should appear in the table. Clear filters — all cases return.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/FilterPanel.tsx components/dashboard/CasesTableClient.tsx
git commit -m "feat: advanced filters — date range, company, estimator, brand"
```

---

## Task 10: Case Summary PDF

**Files:**
- Create: `lib/pdf/CaseSummaryPDF.tsx`
- Create: `app/api/cases/[id]/pdf/route.ts`
- Modify: `app/(dashboard)/cases/[id]/page.tsx`

- [ ] **Step 1: Create the PDF document component**

Create `lib/pdf/CaseSummaryPDF.tsx`:

```typescript
import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import path from 'path'

// Register Lato fonts (TTF files in public/fonts/)
Font.register({
  family: 'Lato',
  fonts: [
    { src: path.join(process.cwd(), 'public/fonts/Lato-Regular.ttf'), fontWeight: 400 },
    { src: path.join(process.cwd(), 'public/fonts/Lato-Bold.ttf'), fontWeight: 700 },
    { src: path.join(process.cwd(), 'public/fonts/Lato-Black.ttf'), fontWeight: 900 },
    { src: path.join(process.cwd(), 'public/fonts/Lato-Light.ttf'), fontWeight: 300 },
  ],
})

const TEAL = '#009BB4'
const NAVY = '#001A22'
const NAVY2 = '#002D3A'
const ROW_TINT = '#E6F7FA'
const GREY = '#494948'
const LIGHT_BLUE = '#B0E8F0'

const s = StyleSheet.create({
  page: { fontFamily: 'Lato', backgroundColor: '#ffffff', paddingBottom: 60 },
  header: { backgroundColor: NAVY, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14 },
  headerLeft: { color: '#ffffff', fontSize: 11, fontWeight: 700 },
  headerRight: { color: TEAL, fontSize: 9, fontWeight: 400, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: NAVY, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 10 },
  footerText: { color: '#ffffff', fontSize: 8, fontWeight: 300 },
  footerPage: { color: TEAL, fontSize: 9, fontWeight: 700 },
  body: { paddingHorizontal: 28, paddingTop: 20 },
  plateBlock: { marginBottom: 20 },
  plate: { fontSize: 32, fontWeight: 900, color: TEAL, letterSpacing: 4 },
  vehicleLabel: { fontSize: 12, fontWeight: 300, color: GREY, marginTop: 4 },
  statusRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  statusBadge: { backgroundColor: TEAL, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: 700 },
  entryDate: { fontSize: 9, color: '#9ca3af', marginTop: 4 },
  sectionHeader: { backgroundColor: TEAL, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, marginBottom: 0 },
  sectionTitleEN: { color: '#ffffff', fontSize: 9, fontWeight: 900 },
  sectionTitleGR: { color: LIGHT_BLUE, fontSize: 8, fontWeight: 300 },
  table: { marginBottom: 18 },
  row: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6 },
  rowAlt: { backgroundColor: ROW_TINT },
  label: { width: '35%', fontSize: 8, fontWeight: 700, color: NAVY, textTransform: 'uppercase' },
  value: { flex: 1, fontSize: 9, fontWeight: 400, color: GREY },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },
})

interface CaseData {
  plate: string
  brand: string
  model: string
  entryDate: Date | string
  status: string
  mileage: number | null
  vehicleRegistrationDate: Date | string | null
  notes: string | null
  owner: { name: string | null; address: string | null; phone: string | null } | null
  customerInsurance: { company: string | null; phone: string | null; email: string | null; officer: string | null; estimator: string | null; caseNumber: string | null } | null
  thirdPartyInsurance: { company: string | null; phone: string | null; email: string | null; officer: string | null; estimator: string | null; caseNumber: string | null } | null
  internal: { estimateNumber: string | null; invoiceNumber: string | null; sentForPaymentDate: Date | string | null; paymentDetails: string | null } | null
}

function Field({ label, value, alt }: { label: string; value: string | null | undefined; alt?: boolean }) {
  return (
    <View style={[s.row, alt ? s.rowAlt : {}]}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value || '—'}</Text>
    </View>
  )
}

function Section({ titleEN, titleGR, children }: { titleEN: string; titleGR: string; children: React.ReactNode }) {
  return (
    <View style={s.table}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitleEN}>{titleEN}</Text>
        <Text style={s.sectionTitleGR}>{titleGR}</Text>
      </View>
      {children}
    </View>
  )
}

function fmt(d: Date | string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('el-CY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function CaseSummaryPDF({ c }: { c: CaseData }) {
  const hasTP = c.thirdPartyInsurance && Object.values(c.thirdPartyInsurance).some(v => v)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerLeft}>MOTOWAREHOUSE LTD</Text>
          <View>
            <Text style={s.headerRight}>ΑΣΦΑΛΙΣΤΙΚΗ ΥΠΟΘΕΣΗ</Text>
            <Text style={s.headerRight}>INSURANCE CASE</Text>
          </View>
        </View>

        <View style={s.body}>
          {/* Plate block */}
          <View style={s.plateBlock}>
            <Text style={s.plate}>{c.plate}</Text>
            <Text style={s.vehicleLabel}>{c.brand} {c.model}</Text>
            <View style={s.statusRow}>
              <View style={s.statusBadge}><Text style={s.statusBadgeText}>{c.status.replace(/_/g, ' ')}</Text></View>
            </View>
            <Text style={s.entryDate}>Entry date: {fmt(c.entryDate)}</Text>
          </View>

          {/* Vehicle */}
          <Section titleEN="VEHICLE DETAILS" titleGR="Στοιχεία Οχήματος">
            <Field label="Plate" value={c.plate} />
            <Field label="Brand" value={c.brand} alt />
            <Field label="Model" value={c.model} />
            <Field label="Mileage" value={c.mileage ? `${c.mileage.toLocaleString()} km` : null} alt />
            <Field label="Registration Date" value={fmt(c.vehicleRegistrationDate)} />
          </Section>

          {/* Owner */}
          {c.owner && (
            <Section titleEN="OWNER DETAILS" titleGR="Στοιχεία Ιδιοκτήτη">
              <Field label="Name" value={c.owner.name} />
              <Field label="Phone" value={c.owner.phone} alt />
              <Field label="Address" value={c.owner.address} />
            </Section>
          )}

          {/* Customer Insurance */}
          {c.customerInsurance && (
            <Section titleEN="CUSTOMER'S INSURANCE" titleGR="Ασφάλεια Πελάτη">
              <Field label="Company" value={c.customerInsurance.company} />
              <Field label="Case Number" value={c.customerInsurance.caseNumber} alt />
              <Field label="Officer" value={c.customerInsurance.officer} />
              <Field label="Estimator" value={c.customerInsurance.estimator} alt />
              <Field label="Phone" value={c.customerInsurance.phone} />
              <Field label="Email" value={c.customerInsurance.email} alt />
            </Section>
          )}

          {/* Third Party Insurance */}
          {hasTP && (
            <Section titleEN="THIRD PARTY INSURANCE" titleGR="Ασφάλεια Τρίτου">
              <Field label="Company" value={c.thirdPartyInsurance!.company} />
              <Field label="Case Number" value={c.thirdPartyInsurance!.caseNumber} alt />
              <Field label="Officer" value={c.thirdPartyInsurance!.officer} />
              <Field label="Estimator" value={c.thirdPartyInsurance!.estimator} alt />
              <Field label="Phone" value={c.thirdPartyInsurance!.phone} />
              <Field label="Email" value={c.thirdPartyInsurance!.email} alt />
            </Section>
          )}

          {/* Internal */}
          {c.internal && (
            <Section titleEN="INTERNAL" titleGR="Εσωτερικά">
              <Field label="Estimate Number" value={c.internal.estimateNumber} />
              <Field label="Invoice Number" value={c.internal.invoiceNumber} alt />
              <Field label="Sent for Payment" value={fmt(c.internal.sentForPaymentDate)} />
              <Field label="Payment Details" value={c.internal.paymentDetails} alt />
            </Section>
          )}

          {/* Notes */}
          {c.notes && (
            <Section titleEN="NOTES" titleGR="Σημειώσεις">
              <View style={s.row}>
                <Text style={s.value}>{c.notes}</Text>
              </View>
            </Section>
          )}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Motowarehouse Ltd · 40 Αθηνών, Στρόβολος · Tel: 22 328 788 · support@motowarehouse.com.cy</Text>
          <Text style={s.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Create the PDF API route**

Create `app/api/cases/[id]/pdf/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { renderToBuffer } from '@react-pdf/renderer'
import { CaseSummaryPDF } from '@/lib/pdf/CaseSummaryPDF'
import React from 'react'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const c = await prisma.case.findUnique({
    where: { id: params.id },
    include: { owner: true, customerInsurance: true, thirdPartyInsurance: true, internal: true },
  })

  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const buffer = await renderToBuffer(React.createElement(CaseSummaryPDF, { c }))

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="case-${c.plate}.pdf"`,
    },
  })
}
```

- [ ] **Step 3: Add Export PDF button to case detail page**

In `app/(dashboard)/cases/[id]/page.tsx`, add a PDF export button next to the Edit button in the case header:

```typescript
// In the case header div, alongside the Edit button:
<div className="flex items-center gap-2">
  <a
    href={`/api/cases/${c.id}/pdf`}
    target="_blank"
    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white
               text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
  >
    <FileDown size={14} /> Export PDF
  </a>
  <Link
    href={`/cases/${c.id}/edit`}
    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white
               text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
  >
    <Pencil size={14} /> Edit Case
  </Link>
</div>
```

Add `FileDown` to the lucide-react import.

- [ ] **Step 4: Verify PDF generation**

Open a case detail page. Click "Export PDF". A PDF should download named `case-[PLATE].pdf`. Open it and verify:
- Header bar: dark navy, "MOTOWAREHOUSE LTD" left, "ΑΣΦΑΛΙΣΤΙΚΗ ΥΠΟΘΕΣΗ" right
- Plate number large in teal
- Sections with teal headers
- Footer bar: dark navy with contact info and page number

If the fonts fail to load, check that `public/fonts/*.ttf` files exist and are non-empty.

- [ ] **Step 5: Commit**

```bash
git add lib/pdf/ app/api/cases/[id]/pdf/ app/(dashboard)/cases/[id]/page.tsx
git commit -m "feat: case summary PDF — CFMOTO branded export with @react-pdf/renderer"
```

---

## Task 11: Final Build Verification + Deploy Prep

- [ ] **Step 1: Full production build check**

```bash
npm run build
```

Expected: no TypeScript errors, no missing imports. If there are errors, fix them before proceeding.

- [ ] **Step 2: Verify all features manually**

- `/contacts` — add a company, officer, estimator; edit and delete each
- `/cases/new` — quick-select company populates insurance fields
- Case detail — "Add Note" saves and appears in activity log
- Case detail — "Templates" copies correct text to clipboard
- Case detail — "Export PDF" downloads branded PDF
- Dashboard — two charts visible below stats cards
- Dashboard — Filters button expands; brand filter works

- [ ] **Step 3: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 4: Deploy on Railway**

On Railway:
1. Open your app service → Settings → verify `DATABASE_URL` is set (Railway auto-provides this from the Postgres plugin — it uses the internal URL, which is correct when running inside Railway)
2. Add all remaining env vars: `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your Railway app URL), `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
3. Railway will redeploy automatically after env var changes

- [ ] **Step 5: Custom domain (optional)**

In Railway → your app → Settings → Domains → Add Custom Domain. Enter `insurance.motowarehouse.com.cy` (or similar). Railway shows a CNAME record — add it in your DNS provider (Cloudflare DNS). SSL certificate is issued automatically within minutes.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "chore: phase 2 complete — contacts, notes, templates, PDF, charts, filters"
git push origin main
```
