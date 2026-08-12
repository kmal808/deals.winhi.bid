import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { BRAND } from '@/lib/brand'
import { Letterhead } from './letterhead'
import { calculateOrderTotals, formatCurrency, lineItemPrice } from '@/lib/pricing'
import { designFromOperationType, type UnitDesign } from '@/lib/window-design'
import { WindowDrawing } from './window-drawing'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BRAND.orange,
  },
  companyInfo: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: BRAND.black,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: BRAND.tint,
    color: BRAND.black,
    padding: 6,
    borderLeftWidth: 3,
    borderLeftColor: BRAND.orange,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 100,
    color: '#666',
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.black,
    color: '#fff',
    padding: 6,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 6,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  col0: { width: '12%' },
  col1: { width: '20%' },
  col2: { width: '21%' },
  col3: { width: '13%' },
  col4: { width: '19%' },
  col5: { width: '15%', textAlign: 'right' },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    color: '#666',
  },
  totalValue: {
    fontWeight: 'bold',
  },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: BRAND.orange,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BRAND.orange,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#666',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  validityNote: {
    marginTop: 20,
    padding: 10,
    backgroundColor: BRAND.tint,
    fontSize: 9,
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
  frameColor?: { name: string; hexColor?: string | null } | null
  glassType?: { name: string } | null
}

interface Customer {
  id: number
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  email: string | null
  discountPercent: string | null
  windows: Window[]
  representative?: { name: string } | null
}

interface EstimateTemplateProps {
  customer: Customer
  estimateDate?: string
  validUntil?: string
}

export function EstimateTemplate({ customer, estimateDate, validUntil }: EstimateTemplateProps) {
  const today = estimateDate || new Date().toLocaleDateString()
  const validity = validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()

  const {
    itemsTotal: windowsTotal,
    discountPercent,
    discountAmount,
    subtotal,
    taxAmount,
    total,
  } = calculateOrderTotals({
    items: customer.windows,
    discountPercent: customer.discountPercent,
  })

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Letterhead meta={[{ label: 'Date', value: today }]} />

        <Text style={styles.title}>Estimate</Text>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{customer.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>
              {[customer.address, customer.city, customer.state, customer.zip]
                .filter(Boolean)
                .join(', ') || '—'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{customer.phone || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{customer.email || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{today}</Text>
          </View>
          {customer.representative && (
            <View style={styles.row}>
              <Text style={styles.label}>Sales Rep:</Text>
              <Text style={styles.value}>{customer.representative.name}</Text>
            </View>
          )}
        </View>

        {/* Windows Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Windows & Doors</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col0}>Drawing</Text>
              <Text style={styles.col1}>Location</Text>
              <Text style={styles.col2}>Product</Text>
              <Text style={styles.col3}>Size</Text>
              <Text style={styles.col4}>Options</Text>
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
                    boxWidth={52}
                    boxHeight={52}
                  />
                </View>
                <Text style={styles.col1}>{window.location}</Text>
                <Text style={styles.col2}>
                  {window.productConfig?.name || '—'}
                  {window.brand && ` (${window.brand.name})`}
                </Text>
                <Text style={styles.col3}>{window.width}" × {window.height}"</Text>
                <Text style={styles.col4}>
                  {[window.frameColor?.name, window.glassType?.name].filter(Boolean).join(', ') || '—'}
                </Text>
                <Text style={styles.col5}>
                  {formatCurrency(lineItemPrice(window))}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(windowsTotal)}</Text>
          </View>
          {discountPercent > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount ({discountPercent}%):</Text>
              <Text style={styles.totalValue}>-{formatCurrency(discountAmount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>After Discount:</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (4.712%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Validity Note */}
        <View style={styles.validityNote}>
          <Text>
            This estimate is valid until {validity}. Prices are subject to change after this date.
            Final measurements will be taken upon contract signing.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {BRAND.company.name} | Lic# {BRAND.company.license} | This is an estimate only, not a
            contract.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
