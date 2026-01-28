import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download } from 'lucide-react'
import { EstimateTemplate } from '@/components/pdf/estimate-template'
import { getCustomer } from '@/server/functions/customers'
import { getSession } from '@/server/functions/auth'

export const Route = createFileRoute('/_protected/customers/$customerId/estimate')({
  loader: async ({ params }) => {
    const session = await getSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    const customerId = parseInt(params.customerId, 10)
    const customer = await (getCustomer as any)({
      data: {
        customerId,
        representativeId: session.userId,
        role: session.role,
      },
    })

    return { customer, session }
  },
  component: EstimatePage,
})

function EstimatePage() {
  const { customer } = Route.useLoaderData()
  const navigate = useNavigate()
  const [showPreview, setShowPreview] = useState(true)

  const estimateDate = new Date().toLocaleDateString()
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate({ to: '/customers/$customerId', params: { customerId: String(customer.id) } })
            }
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customer
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estimate</h1>
            <p className="text-gray-500">{customer.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PDFDownloadLink
            document={
              <EstimateTemplate
                customer={customer}
                estimateDate={estimateDate}
                validUntil={validUntil}
              />
            }
            fileName={`estimate-${customer.name.replace(/\s+/g, '-').toLowerCase()}.pdf`}
          >
            {({ loading }) => (
              <Button disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                {loading ? 'Generating...' : 'Download PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* PDF Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Preview</span>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </CardTitle>
        </CardHeader>
        {showPreview && (
          <CardContent>
            <div className="border rounded-lg overflow-hidden" style={{ height: '800px' }}>
              <PDFViewer width="100%" height="100%" showToolbar={false}>
                <EstimateTemplate
                  customer={customer}
                  estimateDate={estimateDate}
                  validUntil={validUntil}
                />
              </PDFViewer>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Estimate Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Items</p>
              <p className="text-lg font-semibold">{customer.windows?.length || 0}</p>
            </div>
            <div>
              <p className="text-gray-500">Estimate Date</p>
              <p className="text-lg font-semibold">{estimateDate}</p>
            </div>
            <div>
              <p className="text-gray-500">Valid Until</p>
              <p className="text-lg font-semibold">{validUntil}</p>
            </div>
            <div>
              <p className="text-gray-500">Total</p>
              <p className="text-lg font-semibold text-blue-600">
                $
                {(
                  customer.windows?.reduce(
                    (sum: number, w: any) =>
                      sum + parseFloat(w.manualPrice || w.calculatedPrice || '0'),
                    0
                  ) *
                  (1 - parseFloat(customer.discountPercent || '0') / 100) *
                  1.04712
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
