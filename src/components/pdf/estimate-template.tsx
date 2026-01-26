import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

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
    color: '#1e40af',
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
    marginVertical: 20,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    padding: 6,
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
    backgroundColor: '#1e40af',
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
  col1: { width: '25%' },
  col2: { width: '25%' },
  col3: { width: '15%' },
  col4: { width: '20%' },
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
    borderTopColor: '#1e40af',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
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
    backgroundColor: '#fef3c7',
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
  brand?: { name: string } | null
  productConfig?: { name: string } | null
  frameColor?: { name: string } | null
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

  const windowsTotal = customer.windows.reduce((sum, w) => {
    return sum + parseFloat(w.manualPrice || w.calculatedPrice || '0')
  }, 0)

  const discountPercent = parseFloat(customer.discountPercent || '0')
  const discountAmount = windowsTotal * (discountPercent / 100)
  const subtotal = windowsTotal - discountAmount
  const taxAmount = subtotal * 0.04712
  const total = subtotal + taxAmount

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Windows Hawaii</Text>
          <Text style={styles.companyInfo}>
            123 Aloha Street, Honolulu, HI 96801 | (808) 555-1234 | info@windowshawaii.com
          </Text>
        </View>

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
                  ${parseFloat(window.manualPrice || window.calculatedPrice || '0').toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>${windowsTotal.toFixed(2)}</Text>
          </View>
          {discountPercent > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount ({discountPercent}%):</Text>
              <Text style={styles.totalValue}>-${discountAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>After Discount:</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (4.712%):</Text>
            <Text style={styles.totalValue}>${taxAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
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
            Windows Hawaii | License #ABC123456 | This is an estimate only, not a contract.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
