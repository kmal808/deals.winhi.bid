import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Plus, FileText, FileCheck, Pencil, Save, X, Trash2 } from 'lucide-react'
import { getCustomer, updateCustomer, deleteCustomer } from '@/server/functions/customers'
import { getSession } from '@/server/functions/auth'
import { WindowsTable } from '@/components/windows-table'
import { ContractTerms } from '@/components/contract-terms'
import {
  calculateDiscountCeiling,
  calculateOrderTotals,
  formatCurrency,
  TAX_RATE,
} from '@/lib/pricing'

export const Route = createFileRoute('/_protected/customers/$customerId/')({
  loader: async ({ params }) => {
    const session = await getSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    const customer = await getCustomer({
      data: { customerId: parseInt(params.customerId, 10) },
    })

    return { customer, session }
  },
  component: CustomerDetailPage,
})

function CustomerDetailPage() {
  const { customer } = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      zip: formData.get('zip') as string,
      phone: formData.get('phone') as string,
      altPhone: formData.get('altPhone') as string,
      email: formData.get('email') as string,
      comments: formData.get('comments') as string,
      discountPercent: formData.get('discountPercent') as string,
    }

    try {
      await updateCustomer({
        data: { customerId: customer.id, data },
      })
      toast.success('Customer updated')
      setIsEditing(false)
      await router.invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update customer')
      setError(err instanceof Error ? err.message : 'Failed to update customer')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return
    }

    try {
      await deleteCustomer({ data: { customerId: customer.id } })
      toast.success('Customer deleted')
      navigate({ to: '/customers' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete customer')
      setError(err instanceof Error ? err.message : 'Failed to delete customer')
    }
  }

  const totals = calculateOrderTotals({
    items: customer.windows,
    discountPercent: customer.discountPercent,
    downPaymentAmount: customer.downPaymentAmount,
  })
  const discountPercent = totals.discountPercent

  // Par is the floor a line is not sold below. Quotes are written above it and
  // discounted back toward it, so this is the room the rep has left to give away.
  // Internal only: it must not reach the estimate or the contract.
  const ceiling = calculateDiscountCeiling(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (customer.windows ?? []).map((w: any) => ({
      calculatedPrice: w.calculatedPrice,
      manualPrice: w.manualPrice,
      width: w.width,
      height: w.height,
      parFactor: w.brand?.parFactor,
    }))
  )
  const roomLeft = Math.max(0, ceiling.maxDiscountPercent - discountPercent)
  const belowPar = ceiling.parTotal > 0 && totals.subtotal < ceiling.parTotal

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/customers' })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-500">
              Created{' '}
              {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '—'}
              {customer.representative && ` by ${customer.representative.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate({ to: '/customers/$customerId/estimate', params: { customerId: String(customer.id) } })}>
            <FileText className="h-4 w-4 mr-2" />
            Estimate
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: '/customers/$customerId/contract', params: { customerId: String(customer.id) } })}>
            <FileCheck className="h-4 w-4 mr-2" />
            Contract
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>Contact details and preferences</CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" name="name" defaultValue={customer.name} required />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" name="address" defaultValue={customer.address || ''} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" name="city" defaultValue={customer.city || ''} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" name="state" defaultValue={customer.state || 'HI'} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP</Label>
                        <Input id="zip" name="zip" defaultValue={customer.zip || ''} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" defaultValue={customer.phone || ''} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="altPhone">Alt Phone</Label>
                      <Input id="altPhone" name="altPhone" defaultValue={customer.altPhone || ''} />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" defaultValue={customer.email || ''} />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="comments">Comments</Label>
                      <textarea
                        id="comments"
                        name="comments"
                        rows={3}
                        defaultValue={customer.comments || ''}
                        className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discountPercent">Discount %</Label>
                      <Input
                        id="discountPercent"
                        name="discountPercent"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        defaultValue={customer.discountPercent || '0'}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Address</dt>
                    <dd className="text-gray-900">
                      {[customer.address, customer.city, customer.state, customer.zip]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="text-gray-900">{customer.phone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Alt Phone</dt>
                    <dd className="text-gray-900">{customer.altPhone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Email</dt>
                    <dd className="text-gray-900">{customer.email || '—'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-gray-500">Comments</dt>
                    <dd className="text-gray-900">{customer.comments || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Discount</dt>
                    <dd className="text-gray-900">{discountPercent}%</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          {/* Windows List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Windows & Doors</CardTitle>
                <CardDescription>{customer.windows?.length || 0} items configured</CardDescription>
              </div>
              <Button onClick={() => navigate({ to: '/configurator/$customerId', params: { customerId: String(customer.id) } })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Window
              </Button>
            </CardHeader>
            <CardContent>
              {customer.windows && customer.windows.length > 0 ? (
                <WindowsTable
                  windows={customer.windows}
                  onUpdate={() => router.invalidate()}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No windows configured yet.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate({ to: '/configurator/$customerId', params: { customerId: String(customer.id) } })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Configure Windows
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <ContractTerms
            customerId={customer.id}
            terms={customer.contractDisclaimers ?? []}
            customTerms={customer.customTerms}
            onChange={() => router.invalidate()}
          />
        </div>

        {/* Pricing Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Windows/Doors</span>
                <span>{formatCurrency(totals.itemsTotal)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-{formatCurrency(totals.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {ceiling.parTotal > 0 && (
                <div
                  className={
                    belowPar
                      ? 'rounded-md bg-red-50 px-3 py-2 text-xs text-red-700'
                      : 'rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600'
                  }
                >
                  <div className="flex justify-between">
                    <span>Par (floor)</span>
                    <span>{formatCurrency(ceiling.parTotal)}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span>{belowPar ? 'Below par' : 'Discount room left'}</span>
                    <span>
                      {belowPar
                        ? `-${formatCurrency(ceiling.parTotal - totals.subtotal)}`
                        : `${roomLeft.toFixed(1)}%`}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400">
                    Internal only — not shown on the estimate or contract.
                  </p>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({(TAX_RATE * 100).toFixed(3)}%)</span>
                <span>{formatCurrency(totals.taxAmount)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
              <hr />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Down Payment</span>
                <span>{formatCurrency(totals.downPayment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Balance Due</span>
                <span>{formatCurrency(totals.balanceDue)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate({ to: '/configurator/$customerId', params: { customerId: String(customer.id) } })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Window/Door
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate({ to: '/customers/$customerId/estimate', params: { customerId: String(customer.id) } })}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Estimate
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate({ to: '/customers/$customerId/contract', params: { customerId: String(customer.id) } })}
              >
                <FileCheck className="h-4 w-4 mr-2" />
                View Contract
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
