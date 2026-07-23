import { Document, Page, Text, View, StyleSheet, renderToBuffer, Image } from '@react-pdf/renderer'
import { formatCurrency, formatDate } from '@/lib/utils'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottom: '1pt solid #e5e7eb',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  companyInfo: {
    alignItems: 'flex-end',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1pt solid #e5e7eb',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #f3f4f6',
    paddingVertical: 8,
  },
  colDesc: { width: '45%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  totals: {
    width: '40%',
    alignSelf: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTop: '1pt solid #e5e7eb',
    marginTop: 4,
    fontWeight: 'bold',
    fontSize: 12,
  },
  notes: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1pt solid #e5e7eb',
  },
})

export async function generateQuotePdfBuffer(quote: any, tenantSettings: any) {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>QUOTE</Text>
            <Text style={{ marginTop: 8, fontSize: 14 }}>{quote.quoteNumber}</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={{ fontWeight: 'bold' }}>{tenantSettings?.companyName ?? 'Claric SaaS'}</Text>
            {tenantSettings?.address ? <Text>{tenantSettings.address}</Text> : <View style={{ width: 0, height: 0 }} />}
            {tenantSettings?.email ? <Text>{tenantSettings.email}</Text> : <View style={{ width: 0, height: 0 }} />}
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={{ width: '45%' }}>
            <Text style={styles.sectionTitle}>Prepared For</Text>
            <Text style={{ fontWeight: 'bold' }}>{quote.customer.companyName}</Text>
            {quote.customer.billingAddress ? <Text>{quote.customer.billingAddress}</Text> : <View style={{ width: 0, height: 0 }} />}
            <Text>{[quote.customer.billingCity, quote.customer.billingState, quote.customer.billingPostal].filter(Boolean).join(', ')}</Text>
            {quote.customer.billingCountry ? <Text>{quote.customer.billingCountry}</Text> : <View style={{ width: 0, height: 0 }} />}
          </View>
          <View style={{ width: '45%', alignItems: 'flex-end' }}>
            <Text style={styles.sectionTitle}>Details</Text>
            <Text>Date: {formatDate(quote.createdAt)}</Text>
            {quote.validUntil ? <Text>Valid Until: {formatDate(quote.validUntil)}</Text> : <View style={{ width: 0, height: 0 }} />}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, { fontWeight: 'bold' }]}>Description</Text>
            <Text style={[styles.colQty, { fontWeight: 'bold' }]}>Qty</Text>
            <Text style={[styles.colPrice, { fontWeight: 'bold' }]}>Unit Price</Text>
            <Text style={[styles.colTotal, { fontWeight: 'bold' }]}>Amount</Text>
          </View>
          {quote.items.map((li: any) => (
            <View key={li.id} style={styles.tableRow}>
              <View style={[styles.colDesc, { flexDirection: 'row', gap: 10 }]}>
                {li.imageUrl || li.product?.imageUrls?.[0] ? (
                  <Image 
                    src={li.imageUrl || li.product?.imageUrls?.[0] || ''} 
                    style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} 
                  />
                ) : (
                  <View style={{ width: 0, height: 0 }} />
                )}
                <View style={{ flex: 1 }}>
                  {li.product ? (
                    <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{li.product.name}</Text>
                  ) : (
                    <View style={{ width: 0, height: 0 }} />
                  )}
                  <Text style={{ color: '#475569' }}>{li.description}</Text>
                </View>
              </View>
              <Text style={styles.colQty}>{Number(li.quantity)}</Text>
              <Text style={styles.colPrice}>{formatCurrency(li.unitPrice)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(li.total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatCurrency(quote.subtotal)}</Text>
          </View>
          {Number(quote.discountAmount) > 0 ? (
            <View style={styles.totalRow}>
              <Text>Discount</Text>
              <Text>-{formatCurrency(quote.discountAmount)}</Text>
            </View>
          ) : (
            <View style={{ width: 0, height: 0 }} />
          )}
          {Number(quote.taxAmount) > 0 ? (
            <View style={styles.totalRow}>
              <Text>Tax</Text>
              <Text>{formatCurrency(quote.taxAmount)}</Text>
            </View>
          ) : (
            <View style={{ width: 0, height: 0 }} />
          )}
          <View style={styles.totalFinal}>
            <Text>Total</Text>
            <Text>{formatCurrency(quote.total)}</Text>
          </View>
        </View>

        {quote.notes || quote.terms ? (
          <View style={styles.notes}>
            {quote.notes ? (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={{ color: '#475569', lineHeight: 1.5 }}>{quote.notes}</Text>
              </View>
            ) : (
              <View style={{ width: 0, height: 0 }} />
            )}
            {quote.terms ? (
              <View>
                <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                <Text style={{ color: '#475569', lineHeight: 1.5 }}>{quote.terms}</Text>
              </View>
            ) : (
              <View style={{ width: 0, height: 0 }} />
            )}
          </View>
        ) : (
          <View style={{ width: 0, height: 0 }} />
        )}
      </Page>
    </Document>
  )

  return renderToBuffer(doc)
}

export async function generateInvoicePdfBuffer(invoice: any, tenantSettings: any) {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={{ marginTop: 8, fontSize: 14 }}>{invoice.invoiceNumber}</Text>
            <Text style={{ marginTop: 4, color: '#64748b', fontSize: 10 }}>Status: {invoice.status.replace('_', ' ')}</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={{ fontWeight: 'bold' }}>{tenantSettings?.companyName ?? 'Claric SaaS'}</Text>
            {tenantSettings?.address ? <Text>{tenantSettings.address}</Text> : <View style={{ width: 0, height: 0 }} />}
            {tenantSettings?.email ? <Text>{tenantSettings.email}</Text> : <View style={{ width: 0, height: 0 }} />}
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={{ width: '45%' }}>
            <Text style={styles.sectionTitle}>Billed To</Text>
            <Text style={{ fontWeight: 'bold' }}>{invoice.customer.companyName}</Text>
            {invoice.customer.billingAddress ? <Text>{invoice.customer.billingAddress}</Text> : <View style={{ width: 0, height: 0 }} />}
            <Text>{[invoice.customer.billingCity, invoice.customer.billingState, invoice.customer.billingPostal].filter(Boolean).join(', ')}</Text>
            {invoice.customer.billingCountry ? <Text>{invoice.customer.billingCountry}</Text> : <View style={{ width: 0, height: 0 }} />}
          </View>
          <View style={{ width: '45%', alignItems: 'flex-end' }}>
            <Text style={styles.sectionTitle}>Details</Text>
            <Text>Issue Date: {formatDate(invoice.issueDate)}</Text>
            {invoice.dueDate ? <Text>Due Date: {formatDate(invoice.dueDate)}</Text> : <View style={{ width: 0, height: 0 }} />}
            {invoice.order ? <Text>Order Number: {invoice.order.orderNumber}</Text> : <View style={{ width: 0, height: 0 }} />}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, { fontWeight: 'bold' }]}>Description</Text>
            <Text style={[styles.colQty, { fontWeight: 'bold' }]}>Qty</Text>
            <Text style={[styles.colPrice, { fontWeight: 'bold' }]}>Unit Price</Text>
            <Text style={[styles.colTotal, { fontWeight: 'bold' }]}>Amount</Text>
          </View>
          {invoice.items.map((li: any) => (
            <View key={li.id} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={{ color: '#1a1a1a' }}>{li.description}</Text>
              </View>
              <Text style={styles.colQty}>{Number(li.quantity)}</Text>
              <Text style={styles.colPrice}>{formatCurrency(li.unitPrice)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(li.total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {Number(invoice.discountAmount) > 0 ? (
            <View style={styles.totalRow}>
              <Text>Discount</Text>
              <Text>-{formatCurrency(invoice.discountAmount)}</Text>
            </View>
          ) : (
            <View style={{ width: 0, height: 0 }} />
          )}
          {Number(invoice.taxAmount) > 0 ? (
            <View style={styles.totalRow}>
              <Text>Tax</Text>
              <Text>{formatCurrency(invoice.taxAmount)}</Text>
            </View>
          ) : (
            <View style={{ width: 0, height: 0 }} />
          )}
          <View style={styles.totalFinal}>
            <Text>Total</Text>
            <Text>{formatCurrency(invoice.total)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Amount Paid</Text>
            <Text>{formatCurrency(invoice.amountPaid)}</Text>
          </View>
          <View style={[styles.totalRow, { borderTop: '0.5pt solid #f3f4f6', paddingTop: 4, marginTop: 4 }]}>
            <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>Amount Due</Text>
            <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>{formatCurrency(invoice.amountDue)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )

  return renderToBuffer(doc)
}
