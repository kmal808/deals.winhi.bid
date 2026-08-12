import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { BRAND } from '@/lib/brand'
import { Letterhead } from './letterhead'
import { calculateOrderTotals, lineItemPrice } from '@/lib/pricing'
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
  col0: { width: '11%' },
  col1: { width: '16%' },
  col2: { width: '22%' },
  col3: { width: '11%' },
  col4: { width: '25%' },
  col5: { width: '15%', textAlign: 'right' },
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
  design?: UnitDesign | null
  brand?: { name: string } | null
  productConfig?: { name: string; operationType?: string | null } | null
  frameType?: { name: string } | null
  frameColor?: { name: string; hexColor?: string | null } | null
  glassType?: { name: string } | null
  gridStyle?: { name: string } | null
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

        {/* Windows Table */}
        <Text style={styles.sectionTitle}>Products & Services</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col0}>Drawing</Text>
            <Text style={styles.col1}>Location</Text>
            <Text style={styles.col2}>Product</Text>
            <Text style={styles.col3}>Size</Text>
            <Text style={styles.col4}>Specifications</Text>
            <Text style={styles.col5}>Price</Text>
          </View>
          {customer.windows.map((window, index) => (
            <View
              key={window.id}
              style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
            >
              <View style={styles.col0}>
                <WindowDrawing
                  design={
                    window.design ??
                    designFromOperationType(window.productConfig?.operationType)
                  }
                  width={parseFloat(window.width) || 36}
                  height={parseFloat(window.height) || 48}
                  frameColor={window.frameColor?.hexColor}
                  boxWidth={46}
                  boxHeight={46}
                />
              </View>
              <Text style={styles.col1}>{window.location}</Text>
              <Text style={styles.col2}>
                {window.productConfig?.name || '—'}
                {window.brand && `\n${window.brand.name}`}
              </Text>
              <Text style={styles.col3}>{window.width}" × {window.height}"</Text>
              <Text style={styles.col4}>
                {[
                  window.frameType?.name,
                  window.frameColor?.name,
                  window.glassType?.name,
                  window.gridStyle?.name !== 'None' ? window.gridStyle?.name : null,
                ]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </Text>
              <Text style={styles.col5}>
                ${lineItemPrice(window).toFixed(2)}
              </Text>
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
