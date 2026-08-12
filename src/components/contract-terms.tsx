import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Pencil, Save, X } from 'lucide-react'
import { updateCustomer } from '@/server/functions/customers'

/**
 * The terms that will print on this customer's contract.
 *
 * The boilerplate is admin-managed and shown read-only: a clause that protects
 * the company should not be rewritable by whoever happens to be closing. Reps
 * add anything job-specific in the one field below it.
 */

interface Term {
  id: number
  description: string
  sortOrder: number | null
}

export function ContractTerms({
  customerId,
  terms,
  customTerms,
  onChange,
}: {
  customerId: number
  terms: Term[]
  customTerms: string | null
  onChange: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(customTerms ?? '')
  const [saving, setSaving] = useState(false)

  const ordered = [...terms].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  const save = async () => {
    setSaving(true)
    try {
      await updateCustomer({ data: { customerId, data: { customTerms: draft } } })
      toast.success('Terms for this job saved')
      setEditing(false)
      onChange()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Terms</CardTitle>
        <CardDescription>Printed on the contract, in this order.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
            <Lock className="h-3 w-3" />
            Standard terms — managed by an admin
          </div>
          {ordered.length === 0 ? (
            <p className="text-sm text-gray-500">No standard terms are set.</p>
          ) : (
            <ol className="space-y-1.5">
              {ordered.map((term, index) => (
                <li key={term.id} className="flex gap-2 text-sm text-gray-700">
                  <span className="w-4 shrink-0 text-gray-400">{index + 1}.</span>
                  <span>{term.description}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">Additional terms for this job</span>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                {customTerms ? 'Edit' : 'Add'}
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                autoFocus
                placeholder="Anything specific to this job — access notes, agreed lead time, work excluded."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={save} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDraft(customTerms ?? '')
                    setEditing(false)
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : customTerms ? (
            <p className="whitespace-pre-wrap text-sm text-gray-700">{customTerms}</p>
          ) : (
            <p className="text-sm text-gray-400">None.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
