import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import { ArrowLeft, KeyRound, Pencil, Plus, ShieldCheck, User } from 'lucide-react'
import {
  createRepresentative,
  listRepresentatives,
  resetRepresentativePassword,
  updateRepresentative,
} from '@/server/functions/representatives'
import { getSession } from '@/server/functions/auth'

export const Route = createFileRoute('/_protected/admin/representatives')({
  loader: async () => ({
    reps: await listRepresentatives(),
    session: await getSession(),
  }),
  component: RepresentativesPage,
})

type Rep = Awaited<ReturnType<typeof listRepresentatives>>[number]

function RepresentativesPage() {
  const { reps, session } = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()

  const [editing, setEditing] = useState<Rep | null>(null)
  const [adding, setAdding] = useState(false)
  const [resetting, setResetting] = useState<Rep | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async (work: () => Promise<unknown>, success: string, close: () => void) => {
    setBusy(true)
    setError('')
    try {
      await work()
      toast.success(success)
      close()
      await router.invalidate()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/admin' })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">People</h1>
            <p className="text-gray-500">Who can sign in, and what they can do</p>
          </div>
        </div>
        <Button onClick={() => { setAdding(true); setError('') }}>
          <Plus className="mr-2 h-4 w-4" />
          Add person
        </Button>
      </div>

      <div className="space-y-3">
        {reps.map((rep) => (
          <Card key={rep.id} className={rep.active ? '' : 'opacity-60'}>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gray-100 p-2">
                  {rep.role === 'admin' ? (
                    <ShieldCheck className="h-4 w-4 text-gray-700" />
                  ) : (
                    <User className="h-4 w-4 text-gray-700" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base">
                    {rep.name}
                    {rep.id === session?.userId && (
                      <span className="ml-2 text-xs font-normal text-gray-400">you</span>
                    )}
                    {!rep.active && (
                      <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs font-normal text-gray-600">
                        deactivated
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {rep.username} · {rep.role === 'admin' ? 'Administrator' : 'Representative'} ·{' '}
                    {rep.customerCount} customer{rep.customerCount === 1 ? '' : 's'}
                    {rep.email ? ` · ${rep.email}` : ''}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setResetting(rep); setError('') }}
                  title="Set a new password"
                >
                  <KeyRound className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditing(rep); setError('') }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Add */}
      <Dialog open={adding} onOpenChange={() => setAdding(false)}>
        <DialogContent onClose={() => setAdding(false)}>
          <DialogHeader>
            <DialogTitle>Add person</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              run(
                () =>
                  createRepresentative({
                    data: {
                      name: f.get('name') as string,
                      username: f.get('username') as string,
                      password: f.get('password') as string,
                      role: f.get('role') as 'admin' | 'representative',
                      email: (f.get('email') as string) || null,
                      phone: (f.get('phone') as string) || null,
                    },
                  }),
                'Account created',
                () => setAdding(false)
              )
            }}
          >
            <DialogBody className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
              )}
              <Field id="name" label="Full name" required />
              <Field id="username" label="Username" required placeholder="mario" />
              <Field
                id="password"
                label="Temporary password"
                type="password"
                required
                hint="At least 8 characters. Give it to them directly and have them change it."
              />
              <RoleField />
              <Field id="email" label="Email (optional)" type="email" />
              <Field id="phone" label="Phone (optional)" />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent onClose={() => setEditing(null)}>
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!editing) return
              const f = new FormData(e.currentTarget)
              run(
                () =>
                  updateRepresentative({
                    data: {
                      representativeId: editing.id,
                      name: f.get('name') as string,
                      role: f.get('role') as 'admin' | 'representative',
                      active: f.get('active') === 'on',
                      email: (f.get('email') as string) || null,
                      phone: (f.get('phone') as string) || null,
                    },
                  }),
                'Saved',
                () => setEditing(null)
              )
            }}
          >
            <DialogBody className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
              )}
              <Field id="name" label="Full name" required defaultValue={editing?.name} />
              <RoleField defaultValue={editing?.role} />
              <Field id="email" label="Email" type="email" defaultValue={editing?.email ?? ''} />
              <Field id="phone" label="Phone" defaultValue={editing?.phone ?? ''} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked={editing?.active} />
                Can sign in
              </label>
              {editing?.id === session?.userId && (
                <p className="text-xs text-gray-500">
                  This is your own account — you cannot remove your own access.
                </p>
              )}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset password */}
      <Dialog open={!!resetting} onOpenChange={() => setResetting(null)}>
        <DialogContent onClose={() => setResetting(null)}>
          <DialogHeader>
            <DialogTitle>New password for {resetting?.name}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!resetting) return
              const f = new FormData(e.currentTarget)
              run(
                () =>
                  resetRepresentativePassword({
                    data: {
                      representativeId: resetting.id,
                      password: f.get('password') as string,
                    },
                  }),
                'Password changed — they have been signed out everywhere',
                () => setResetting(null)
              )
            }}
          >
            <DialogBody className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
              )}
              <Field
                id="password"
                label="New password"
                type="password"
                required
                hint="Signs them out of every device. Give it to them directly."
              />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetting(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Changing…' : 'Change password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({
  id,
  label,
  type = 'text',
  required,
  placeholder,
  hint,
  defaultValue,
}: {
  id: string
  label: string
  type?: string
  required?: boolean
  placeholder?: string
  hint?: string
  defaultValue?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

function RoleField({ defaultValue = 'representative' }: { defaultValue?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="role">Role</Label>
      <select
        id="role"
        name="role"
        defaultValue={defaultValue}
        className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        <option value="representative">Representative — their own customers only</option>
        <option value="admin">Administrator — all customers, plus settings</option>
      </select>
    </div>
  )
}
