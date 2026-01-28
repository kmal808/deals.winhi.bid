import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, FileSignature } from 'lucide-react'
import { ContractTemplate } from '@/components/pdf/contract-template'
import { getCustomer } from '@/server/functions/customers'
import { getSession } from '@/server/functions/auth'

export const Route = createFileRoute('/_protected/customers/$customerId/contract')({
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
  component: ContractPage,
})

function ContractPage() {
  const { customer } = Route.useLoaderData()
  const navigate = useNavigate()
  const [showPreview, setShowPreview] = useState(true)

  const contractDate = new Date().toLocaleDateString()
  const contractNumber = `WH-${customer.id.toString().padStart(5, '0')}`

  // Calculate totals
  const windowsTotal =
    customer.windows?.reduce(
      (sum: number, w: any) => sum + parseFloat(w.manualPrice || w.calculatedPrice || '0'),
      0
    ) || 0
  const discountPercent = parseFloat(customer.discountPercent || '0')
  const subtotal = windowsTotal * (1 - discountPercent / 100)
  const total = subtotal * 1.04712
  const downPayment = customer.downPaymentAmount
    ? parseFloat(customer.downPaymentAmount)
    : total * 0.5

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
            <h1 className="text-2xl font-bold text-gray-900">Contract</h1>
            <p className="text-gray-500">
              {customer.name} • {contractNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PDFDownloadLink
            document={<ContractTemplate customer={customer} contractDate={contractDate} />}
            fileName={`contract-${contractNumber}.pdf`}
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

      {/* Contract Status */}
      <div className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <FileSignature className="h-6 w-6 text-yellow-600" />
        <div>
          <p className="font-medium text-yellow-800">
            {customer.signatureSvg ? 'Contract Signed' : 'Awaiting Signature'}
          </p>
          <p className="text-sm text-yellow-700">
            {customer.signatureSvg
              ? 'Customer signature has been captured.'
              : 'Customer signature has not been captured yet.'}
          </p>
        </div>
      </div>

      {/* PDF Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Contract Preview</span>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </CardTitle>
        </CardHeader>
        {showPreview && (
          <CardContent>
            <div className="border rounded-lg overflow-hidden" style={{ height: '800px' }}>
              <PDFViewer width="100%" height="100%" showToolbar={false}>
                <ContractTemplate customer={customer} contractDate={contractDate} />
              </PDFViewer>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Contract Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Contract #</p>
              <p className="text-lg font-semibold">{contractNumber}</p>
            </div>
            <div>
              <p className="text-gray-500">Date</p>
              <p className="text-lg font-semibold">{contractDate}</p>
            </div>
            <div>
              <p className="text-gray-500">Total</p>
              <p className="text-lg font-semibold">${total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500">Down Payment</p>
              <p className="text-lg font-semibold text-green-600">${downPayment.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500">Balance Due</p>
              <p className="text-lg font-semibold text-blue-600">
                ${(total - downPayment).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimers */}
      {customer.contractDisclaimers && customer.contractDisclaimers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions ({customer.contractDisclaimers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              {customer.contractDisclaimers.map((d: any) => (
                <li key={d.id}>{d.description}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
