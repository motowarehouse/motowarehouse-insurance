# Phase 2 Features — Design Spec
**Date:** 2026-06-26  
**Project:** Motowarehouse Insurance Case Management App  
**Status:** Approved

---

## Overview

Five features to be added to the existing Next.js 14 / PostgreSQL / Prisma app:

1. Contacts Directory (Estimators, Officers, Insurance Companies)
2. Quick Case Notes
3. Message Templates (Viber + Authorization Email)
4. Case Summary PDF (CFMOTO branded)
5. Dashboard Charts + Advanced Filters

---

## Feature 1: Contacts Directory

### Data Models (Prisma additions)

```prisma
model InsuranceCompany {
  id        String    @id @default(cuid())
  name      String
  phone     String?
  email     String?
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  officers  Officer[]
  estimators EstimatorCompany[]
}

model Officer {
  id                String           @id @default(cuid())
  name              String
  phone             String?
  email             String?
  company           InsuranceCompany @relation(fields: [companyId], references: [id])
  companyId         String
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
}

model Estimator {
  id        String             @id @default(cuid())
  name      String
  phone     String?
  email     String?
  notes     String?
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt
  companies EstimatorCompany[]
}

model EstimatorCompany {
  estimator   Estimator        @relation(fields: [estimatorId], references: [id])
  estimatorId String
  company     InsuranceCompany @relation(fields: [companyId], references: [id])
  companyId   String
  @@id([estimatorId, companyId])
}
```

### Case Model Updates

Add optional foreign keys to `Case` (soft links — freehand text still allowed):
- `customerInsurance.officerId` → Officer
- `customerInsurance.estimatorId` → Estimator  
- `thirdPartyInsurance.officerId` → Officer
- `thirdPartyInsurance.estimatorId` → Estimator

### New Page: `/contacts`

- Sidebar link: "Contacts / Επαφές" 
- Three tabs: **Companies** | **Officers** | **Estimators**
- Each tab: sortable table with Add / Edit / Delete actions via inline modals
- No separate detail pages — all CRUD via modals on this single page

### API Routes

- `GET/POST /api/contacts/companies`
- `GET/PUT/DELETE /api/contacts/companies/[id]`
- `GET/POST /api/contacts/officers`
- `GET/PUT/DELETE /api/contacts/officers/[id]`
- `GET/POST /api/contacts/estimators`
- `GET/PUT/DELETE /api/contacts/estimators/[id]`

### Case Form Integration

- Insurance Company field → searchable dropdown (replaces freehand text)
- Selecting a company filters the Officer dropdown to that company's officers
- Selecting an officer auto-fills their phone and email fields
- Estimator field → searchable dropdown from Estimator table
- Freehand typing still allowed if contact not in directory

---

## Feature 2: Quick Case Notes

### UI

On the case detail page, below the existing Notes section:

- Textarea (3 rows, placeholder: "Add a note… / Προσθήκη σημείωσης…")
- "Save Note" button
- On submit: `POST /api/cases/[id]/notes` → creates Activity with `action: NOTE_ADDED`, `details: <text>`
- Activity Log updates immediately without page reload (optimistic UI or revalidation)
- No full form reload required

### API Route

`POST /api/cases/[id]/notes`  
Body: `{ text: string }`  
Creates Activity entry, returns updated activity list.

---

## Feature 3: Message Templates

### UI

A **"Templates / Πρότυπα"** card on the case detail page.  
Two copy-to-clipboard buttons with "Copied! ✓" confirmation toast.

### Template 1: Viber Quote Approval

Sent to estimator after their visit, requesting approval of the quote.

```
Αγαπητέ/η [Estimator Name],

Σας αποστέλλουμε την προσφορά μας για το όχημα:
Πινακίδα: [Plate]
Όχημα: [Brand] [Model]
Αρ. Προσφοράς: [Estimate Number]

Παρακαλούμε επιβεβαιώστε αν η προσφορά είναι αποδεκτή.

Motowarehouse Ltd — 22 328 788
```

### Template 2: Authorization Request Email

Sent to the insurance officer after estimator approves, requesting written authorization.

```
Subject: Εξουσιοδότηση Επισκευής — [Plate]

Καλημέρα [Officer Name],

Αναφορικά με το ατύχημα με την μοτοσυκλέτα με αριθμό εγγραφής [Plate] 
παρακαλώ να μας ενημερώσετε για να προχωρήσουμε στην επιδιόρθωση με 
ευθύνη της [Insurance Company] σύμφωνα με την εκτίμηση του κ. [Estimator Name].

Πινακίδα: [Plate]
Όχημα: [Brand] [Model]
Αρ. Υπόθεσης: [Insurance Case Number]
Αρ. Εκτίμησης: [Estimate Number]

Motowarehouse Ltd
support@motowarehouse.com.cy | Τηλ: 22 328 788
```

### Placeholder Behaviour

All placeholders filled from live case data. If a field is missing (e.g. no estimate number yet), shows `[—]` so the user knows to fill it in manually before sending.

---

## Feature 4: Case Summary PDF

### Trigger

"Export PDF / Εξαγωγή PDF" button on the case detail page.  
`GET /api/cases/[id]/pdf` → returns PDF binary with `Content-Type: application/pdf`.

### Generation

Server-side using **`@react-pdf/renderer`** — a pure JavaScript PDF library (no Python required).  
Runs inside a Next.js API route, no external process needed. Supports full CFMOTO brand spec including custom fonts and colors. Simpler Railway deployment than Python/ReportLab.

### CFMOTO Brand Spec

Follows CFMOTO Visual Identity Guidelines throughout:
- **Colors:** Primary teal `#009BB4`, dark navy `#001A22`, light teal rows `#E6F7FA`, grey text `#494948`
- **Fonts:** Lato (Black for headings, Bold for labels, Regular for values, Light for subtitles)
- **Header bar:** Dark navy background — "MOTOWAREHOUSE LTD" left, "ΑΣΦΑΛΙΣΤΙΚΗ ΥΠΟΘΕΣΗ / INSURANCE CASE" right in teal
- **Footer bar:** Dark navy — contact info centred, page number right in teal bold
- **Section headers:** Teal bar, white LatoBlack English title + light-blue LatoLight Greek title

### PDF Sections (A4, 1.5cm margins)

1. **Cover block** — plate large in teal, brand + model, entry date, current status badge
2. **Vehicle Details / Στοιχεία Οχήματος** — mileage, registration date, model
3. **Owner Details / Στοιχεία Ιδιοκτήτη** — name, address, phone
4. **Customer Insurance / Ασφάλεια Πελάτη** — company, officer, estimator, case number
5. **Third Party Insurance / Ασφάλεια Τρίτου** — same structure (omitted if empty)
6. **Internal / Εσωτερικά** — estimate number, invoice number, payment date, payment details
7. **Notes / Σημειώσεις** — full notes text (omitted if empty)

---

## Feature 5: Dashboard Charts + Advanced Filters

### Charts

Added below the existing stats cards on the dashboard. Two side-by-side cards using **Recharts** (new dependency: `npm install recharts`).

**Cases by Status (horizontal bar chart)**
- One bar per active status (excludes COMPLETED, REJECTED, ON_HOLD)
- Bar color matches existing status color system
- Shows count label at end of each bar

**Monthly Intake (bar chart)**
- Last 6 calendar months
- Bar color: teal `#009BB4`
- X-axis: month name (e.g. "Ιαν", "Φεβ"…)
- Y-axis: case count
- Data fetched server-side on dashboard load

### Advanced Filters

Expandable filter panel above the cases table (collapsed by default, "Filters ▾" toggle button).

Filter fields:
- **Entry Date From / To** — date range pickers
- **Insurance Company** — dropdown populated from InsuranceCompany table
- **Estimator** — dropdown populated from Estimator table
- **Brand** — SYM / CFMOTO / OTHER (existing enum)

Behaviour:
- All filters combine with the existing search input and status tab
- "Clear Filters" button resets all fields
- Filter state stored in URL query params (shareable/bookmarkable)
- Filtering happens client-side for instant response (no extra API calls unless data set grows large)

---

## Implementation Order

1. Prisma schema changes + migrations (foundation for everything)
2. Contacts Directory (models → API → UI)
3. Case form integration (dropdowns linked to directory)
4. Quick Case Notes (small, self-contained)
5. Message Templates (pure frontend, no new API)
6. Dashboard Charts (Recharts, server data)
7. Advanced Filters (URL params, client filtering)
8. Case Summary PDF (Python/ReportLab script + API route)

---

## Out of Scope

- Sending emails or Viber messages directly from the app (copy-to-clipboard only)
- Multi-user permissions per contact
- Contact import from Excel
- PDF templating for anything other than the case summary
