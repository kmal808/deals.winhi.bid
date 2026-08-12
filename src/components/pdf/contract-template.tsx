import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { BRAND } from '@/lib/brand'
import { Letterhead } from './letterhead'
import { calculateOrderTotals } from '@/lib/pricing'
import { designFromOperationType, type UnitDesign } from '@/lib/window-design'
import { WindowDrawing } from './window-drawing'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companySection: {},
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BRAND.orange,
  },
  companyInfo: {
    fontSize: 8,
    color: '#666',
    marginTop: 4,
  },
  contractNumber: {
    fontSize: 9,
    textAlign: 'right',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    backgroundColor: BRAND.orange,
    color: BRAND.black,
    padding: 8,
  },
  twoColumn: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  column: {
    flex: 1,
    paddingRight: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.orange,
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: 70,
    color: '#666',
    fontSize: 9,
  },
  value: {
    flex: 1,
    fontSize: 9,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.black,
    color: '#fff',
    padding: 5,
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    padding: 4,
    fontSize: 8,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  // Spec matrix, matching the column set the shop already works from.
  cLoc: { width: '13%' },
  cBrand: { width: '8%' },
  cConfig: { width: '7%' },
  cPic: { width: '10%' },
  cFrame: { width: '8%' },
  cW: { width: '6%', textAlign: 'right' },
  cH: { width: '6%', textAlign: 'right' },
  cColor: { width: '9%' },
  cLowE: { width: '5%', textAlign: 'center' },
  cGlass: { width: '9%' },
  cGrid: { width: '8%' },
  cNotes: { width: '11%' },
  colTotalLabel: { width: '85%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  viewNote: {
    fontSize: 7,
    color: BRAND.orange,
    marginTop: 4,
    marginBottom: 2,
  },
  totalsBox: {
    marginTop: 15,
    marginLeft: 'auto',
    width: 220,
    borderWidth: 1,
    borderColor: BRAND.orange,
    padding: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    fontSize: 9,
  },
  grandTotal: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: BRAND.orange,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  paymentSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: BRAND.tint,
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    fontSize: 9,
  },
  disclaimersSection: {
    marginTop: 15,
  },
  disclaimer: {
    fontSize: 8,
    marginBottom: 4,
    paddingLeft: 10,
  },
  disclaimerBullet: {
    position: 'absolute',
    left: 0,
  },
  signatureSection: {
    marginTop: 20,
    flexDirection: 'row',
  },
  signatureBox: {
    flex: 1,
    marginRight: 20,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 4,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    height: 40,
    marginBottom: 4,
  },
  signatureImage: {
    height: 40,
    marginBottom: 4,
  },
  dateLine: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 8,
    color: '#666',
    marginRight: 10,
  },
  dateValue: {
    fontSize: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    width: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#666',
    fontSize: 7,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: '#666',
  },
})

interface Window {
  id: number
  location: string
  width: string
  height: string
  calculatedPrice: string | null
  manualPrice: string | null
  lowE?: boolean | null
  specialInstructions?: string | null
  design?: UnitDesign | null
  brand?: { name: string } | null
  productConfig?: { name: string; operationType?: string | null } | null
  frameType?: { name: string } | null
  frameColor?: { name: string; hexColor?: string | null } | null
  glassType?: { name: string } | null
  gridStyle?: { name: string } | null
  gridSize?: { size: string } | null
}

interface Disclaimer {
  id: number
  description: string
  sortOrder: number | null
}

interface Customer {
  id: number
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  altPhone: string | null
  email: string | null
  discountPercent: string | null
  downPaymentAmount: string | null
  signatureSvg: string | null
  windows: Window[]
  contractDisclaimers: Disclaimer[]
  representative?: { name: string } | null
}

interface ContractTemplateProps {
  customer: Customer
  contractDate?: string
}

export function ContractTemplate({ customer, contractDate }: ContractTemplateProps) {
  const today = contractDate || new Date().toLocaleDateString()
  const contractNumber = `WH-${customer.id.toString().padStart(5, '0')}`

  const {
    itemsTotal: windowsTotal,
    discountPercent,
    discountAmount,
    subtotal,
    taxAmount,
    total,
    downPayment,
    balanceDue: balance,
  } = calculateOrderTotals({
    items: customer.windows,
    discountPercent: customer.discountPercent,
    downPaymentAmount: customer.downPaymentAmount,
  })

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Letterhead
          meta={[
            { label: 'Contract #', value: contractNumber },
            { label: 'Date', value: today },
          ]}
        />

        <Text style={styles.title}>Installation Contract</Text>

        {/* Customer & Job Info */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{customer.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>
                {customer.address || ''}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}></Text>
              <Text style={styles.value}>
                {[customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{customer.phone || '—'}</Text>
            </View>
            {customer.altPhone && (
              <View style={styles.row}>
                <Text style={styles.label}>Alt Phone:</Text>
                <Text style={styles.value}>{customer.altPhone}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{customer.email || '—'}</Text>
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Job Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Job Site:</Text>
              <Text style={styles.value}>Same as customer address</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Items:</Text>
              <Text style={styles.value}>{customer.windows.length} windows/doors</Text>
            </View>
            {customer.representative && (
              <View style={styles.row}>
                <Text style={styles.label}>Sales Rep:</Text>
                <Text style={styles.value}>{customer.representative.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Specification matrix */}
        <Text style={styles.sectionTitle}>Specification</Text>
        <Text style={styles.viewNote}>All configurations viewed from the outside, left to right. X = sash that moves, O = sash that is stationary.</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.cLoc}>Location</Text>
            <Text style={styles.cBrand}>Brand</Text>
            <Text style={styles.cConfig}>Config</Text>
            <Text style={styles.cPic}>Picture</Text>
            <Text style={styles.cFrame}>Frame</Text>
            <Text style={styles.cW}>Width</Text>
            <Text style={styles.cH}>Height</Text>
            <Text style={styles.cColor}>Color</Text>
            <Text style={styles.cLowE}>Low E</Text>
            <Text style={styles.cGlass}>Glass</Text>
            <Text style={styles.cGrid}>Grid</Text>
            <Text style={styles.cNotes}>Special Instr.</Text>
          </View>
          {customer.windows.map((window, index) => (
            <View
              key={window.id}
              style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
            >
              <Text style={styles.cLoc}>{window.location}</Text>
              <Text style={styles.cBrand}>{window.brand?.name || '—'}</Text>
              <Text style={styles.cConfig}>
                {window.productConfig?.operationType || '—'}
              </Text>
              <View style={styles.cPic}>
                <WindowDrawing
                  design={
                    window.design ??
                    designFromOperationType(window.productConfig?.operationType)
                  }
                  width={parseFloat(window.width) || 36}
                  height={parseFloat(window.height) || 48}
                  frameColor={window.frameColor?.hexColor}
                  boxWidth={44}
                  boxHeight={44}
                />
              </View>
              <Text style={styles.cFrame}>{window.frameType?.name || '—'}</Text>
              <Text style={styles.cW}>{window.width}"</Text>
              <Text style={styles.cH}>{window.height}"</Text>
              <Text style={styles.cColor}>{window.frameColor?.name || '—'}</Text>
              <Text style={styles.cLowE}>{window.lowE ? 'Y' : 'N'}</Text>
              <Text style={styles.cGlass}>{window.glassType?.name || '—'}</Text>
              <Text style={styles.cGrid}>
                {window.gridStyle && window.gridStyle.name !== 'None'
                  ? [window.gridStyle.name, window.gridSize?.size].filter(Boolean).join(' ')
                  : '—'}
              </Text>
              <Text style={styles.cNotes}>{window.specialInstructions || ''}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text>Products & Services:</Text>
            <Text>${windowsTotal.toFixed(2)}</Text>
          </View>
          {discountPercent > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount ({discountPercent}%):</Text>
              <Text>-${discountAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Hawaii GET (4.712%):</Text>
            <Text>${taxAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>CONTRACT TOTAL:</Text>
            <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Terms */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Payment Terms</Text>
          <View style={styles.paymentRow}>
            <Text>Down Payment (due upon signing):</Text>
            <Text>${downPayment.toFixed(2)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text>Balance (due upon completion):</Text>
            <Text>${balance.toFixed(2)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Page 1 of 2</Text>
        </View>
      </Page>

      {/* Page 2 - Terms & Signature */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>{BRAND.company.name}</Text>
          <Text style={styles.contractNumber}>Contract #: {contractNumber}</Text>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.disclaimersSection}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          {customer.contractDisclaimers.map((disclaimer, index) => (
            <View key={disclaimer.id} style={{ flexDirection: 'row', marginBottom: 6 }}>
              <Text style={{ fontSize: 8, marginRight: 6 }}>{index + 1}.</Text>
              <Text style={[styles.disclaimer, { paddingLeft: 0 }]}>
                {disclaimer.description}
              </Text>
            </View>
          ))}
        </View>

        {/* Agreement Text */}
        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f3f4f6' }}>
          <Text style={{ fontSize: 9, lineHeight: 1.4 }}>
            By signing below, Customer agrees to the terms and conditions stated herein and
            authorizes {BRAND.company.name} to perform the work described above. Customer acknowledges
            receipt of a copy of this contract and agrees to pay the total amount specified
            according to the payment terms outlined.
          </Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Customer Signature:</Text>
            {customer.signatureSvg ? (
              <View style={styles.signatureImage}>
                <Text style={{ fontSize: 8, color: '#666' }}>[Signature on file]</Text>
              </View>
            ) : (
              <View style={styles.signatureLine} />
            )}
            <Text style={{ fontSize: 9 }}>{customer.name}</Text>
            <View style={styles.dateLine}>
              <Text style={styles.dateLabel}>Date:</Text>
              <Text style={styles.dateValue}>{today}</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Company Representative:</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 9 }}>{customer.representative?.name || BRAND.company.name}</Text>
            <View style={styles.dateLine}>
              <Text style={styles.dateLabel}>Date:</Text>
              <Text style={styles.dateValue}>{today}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {BRAND.company.name} | {BRAND.company.address} | Lic# {BRAND.company.license}
          </Text>
          <Text style={{ marginTop: 4 }}>
            Thank you for choosing {BRAND.company.name}!
          </Text>
        </View>
        <Text style={styles.pageNumber}>Page 2 of 2</Text>
      </Page>
    </Document>
  )
}
