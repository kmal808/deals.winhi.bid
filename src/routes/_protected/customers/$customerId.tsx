import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Plus, FileText, FileCheck, Pencil, Save, X, Trash2 } from 'lucide-react'
import { getCustomer, updateCustomer, deleteCustomer } from '@/server/functions/customers'
import { getSession } from '@/lib/auth'
import { WindowsTable } from '@/components/windows-table'

export const Route = createFileRoute('/_protected/customers/$customerId')({
  loader: async ({ params }) => {
    const session = await getSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customer = await (getCustomer as any)({
      data: {
        customerId: parseInt(params.customerId, 10),
        representativeId: session.userId,
        role: session.role,
      },
    })

    return { customer, session }
  },
  component: CustomerDetailPage,
})

function CustomerDetailPage() {
  const { customer, session } = Route.useLoaderData()
  const navigate = useNavigate()
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (updateCustomer as any)({
        data: {
          customerId: customer.id,
          data,
          representativeId: session?.userId,
          role: session?.role,
        },
      })
      toast.success('Customer updated')
      setIsEditing(false)
      // Reload the page to get fresh data
      window.location.reload()
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (deleteCustomer as any)({
        data: {
          customerId: customer.id,
          representativeId: session?.userId,
          role: session?.role,
        },
      })
      toast.success('Customer deleted')
      navigate({ to: '/customers' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete customer')
      setError(err instanceof Error ? err.message : 'Failed to delete customer')
    }
  }

  // Calculate totals from windows
  const windowsTotal = customer.windows?.reduce((sum: number, w: { calculatedPrice?: string; manualPrice?: string }) => {
    const price = parseFloat(w.manualPrice || w.calculatedPrice || '0')
    return sum + price
  }, 0) || 0

  const discountPercent = parseFloat(customer.discountPercent || '0')
  const discountAmount = windowsTotal * (discountPercent / 100)
  const subtotal = windowsTotal - discountAmount
  const taxAmount = subtotal * 0.04712
  const total = subtotal + taxAmount

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
              Created {new Date(customer.createdAt).toLocaleDateString()}
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
                  session={session}
                  onUpdate={() => window.location.reload()}
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
                <span>${windowsTotal.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (4.712%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <hr />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Down Payment (50%)</span>
                <span>${(total * 0.5).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Balance Due</span>
                <span>${(total * 0.5).toFixed(2)}</span>
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
