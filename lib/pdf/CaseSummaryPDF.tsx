import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// Register Lato fonts
Font.register({
  family: 'Lato',
  fonts: [
    { src: '/fonts/Lato-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Lato-Bold.ttf', fontWeight: 700 },
    { src: '/fonts/Lato-Black.ttf', fontWeight: 900 },
    { src: '/fonts/Lato-Light.ttf', fontWeight: 300 },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Lato',
    fontSize: 9,
    color: '#1F2937',
    padding: 40,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#001A22',
    marginHorizontal: -40,
    marginTop: -40,
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  companyName: {
    color: '#009BB4',
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: 2,
  },
  companyTagline: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: 300,
    marginTop: 2,
    opacity: 0.7,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  plateText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: 4,
  },
  modelText: {
    color: '#009BB4',
    fontSize: 9,
    fontWeight: 400,
    marginTop: 2,
  },
  sectionTitle: {
    backgroundColor: '#009BB4',
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 0,
    marginTop: 12,
  },
  table: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  rowTint: {
    backgroundColor: '#E6F7FA',
  },
  cell: {
    flex: 1,
  },
  cellLabel: {
    color: '#6B7280',
    fontSize: 7,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  cellValue: {
    color: '#001A22',
    fontSize: 9,
    fontWeight: 400,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 7,
  },
})

interface CaseData {
  plate: string
  model: string
  brand: string
  mileage: number | null
  entryDate: string
  vehicleRegistrationDate: string | null
  notes: string | null
  status: string
  owner: { name: string | null; phone: string | null; address: string | null } | null
  customerInsurance: {
    company: string | null
    phone: string | null
    email: string | null
    officer: string | null
    estimator: string | null
    caseNumber: string | null
  } | null
  thirdPartyInsurance: {
    company: string | null
    phone: string | null
    email: string | null
    officer: string | null
    estimator: string | null
    caseNumber: string | null
  } | null
  internal: {
    estimateNumber: string | null
    invoiceNumber: string | null
    sentForPaymentDate: string | null
    paymentDetails: string | null
  } | null
}

function val(v: string | null | undefined, fallback = '—') {
  return v || fallback
}

function formatD(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('el-CY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function Row({ label, value, tint }: { label: string; value: string; tint?: boolean }) {
  return (
    <View style={[styles.row, tint ? styles.rowTint : {}]}>
      <View style={styles.cell}>
        <Text style={styles.cellLabel}>{label}</Text>
        <Text style={styles.cellValue}>{value}</Text>
      </View>
    </View>
  )
}

function TwoColRow({ left, right, tint }: { left: [string, string]; right: [string, string]; tint?: boolean }) {
  return (
    <View style={[styles.row, tint ? styles.rowTint : {}]}>
      <View style={styles.cell}>
        <Text style={styles.cellLabel}>{left[0]}</Text>
        <Text style={styles.cellValue}>{left[1]}</Text>
      </View>
      <View style={styles.cell}>
        <Text style={styles.cellLabel}>{right[0]}</Text>
        <Text style={styles.cellValue}>{right[1]}</Text>
      </View>
    </View>
  )
}

export default function CaseSummaryPDF({ c, generatedAt }: { c: CaseData; generatedAt: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>MOTOWAREHOUSE</Text>
            <Text style={styles.companyTagline}>Official CFMOTO &amp; SYM Distributor — Cyprus</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.plateText}>{c.plate}</Text>
            <Text style={styles.modelText}>{c.brand} {c.model}</Text>
          </View>
        </View>

        {/* Vehicle */}
        <Text style={styles.sectionTitle}>Vehicle Details / Στοιχεία Οχήματος</Text>
        <View style={styles.table}>
          <TwoColRow left={['Entry Date', formatD(c.entryDate)]} right={['Status', c.status.replace(/_/g, ' ')]} />
          <TwoColRow left={['Mileage', c.mileage ? `${c.mileage.toLocaleString()} km` : '—']} right={['Reg. Date', formatD(c.vehicleRegistrationDate)]} tint />
          {c.notes && <Row label="Notes" value={c.notes} />}
        </View>

        {/* Owner */}
        {c.owner && (
          <>
            <Text style={styles.sectionTitle}>Owner / Ιδιοκτήτης</Text>
            <View style={styles.table}>
              <TwoColRow left={['Name', val(c.owner.name)]} right={['Phone', val(c.owner.phone)]} />
              <Row label="Address" value={val(c.owner.address)} tint />
            </View>
          </>
        )}

        {/* Customer Insurance */}
        {c.customerInsurance && (
          <>
            <Text style={styles.sectionTitle}>Customer Insurance / Ασφάλεια Πελάτη</Text>
            <View style={styles.table}>
              <TwoColRow left={['Company', val(c.customerInsurance.company)]} right={['Phone', val(c.customerInsurance.phone)]} />
              <TwoColRow left={['Officer', val(c.customerInsurance.officer)]} right={['Case #', val(c.customerInsurance.caseNumber)]} tint />
              <TwoColRow left={['Estimator', val(c.customerInsurance.estimator)]} right={['Email', val(c.customerInsurance.email)]} />
            </View>
          </>
        )}

        {/* Third Party Insurance */}
        {c.thirdPartyInsurance && (
          <>
            <Text style={styles.sectionTitle}>Third Party Insurance / Ασφάλεια Τρίτου</Text>
            <View style={styles.table}>
              <TwoColRow left={['Company', val(c.thirdPartyInsurance.company)]} right={['Phone', val(c.thirdPartyInsurance.phone)]} />
              <TwoColRow left={['Officer', val(c.thirdPartyInsurance.officer)]} right={['Case #', val(c.thirdPartyInsurance.caseNumber)]} tint />
              <TwoColRow left={['Estimator', val(c.thirdPartyInsurance.estimator)]} right={['Email', val(c.thirdPartyInsurance.email)]} />
            </View>
          </>
        )}

        {/* Internal */}
        {c.internal && (
          <>
            <Text style={styles.sectionTitle}>Internal / Εσωτερική Χρήση</Text>
            <View style={styles.table}>
              <TwoColRow left={['Estimate #', val(c.internal.estimateNumber)]} right={['Invoice #', val(c.internal.invoiceNumber)]} />
              <TwoColRow left={['Sent for Payment', formatD(c.internal.sentForPaymentDate)]} right={['Payment Details', val(c.internal.paymentDetails)]} tint />
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Motowarehouse Ltd · 40 Athinon Str., Strovolos, Nicosia · 22 328 788</Text>
          <Text style={styles.footerText}>Generated: {generatedAt}</Text>
        </View>
      </Page>
    </Document>
  )
}
