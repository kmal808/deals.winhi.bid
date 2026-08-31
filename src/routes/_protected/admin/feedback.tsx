import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Check, RotateCcw, User } from 'lucide-react'
import { listFeedback, setFeedbackResolved } from '@/server/functions/feedback'

export const Route = createFileRoute('/_protected/admin/feedback')({
  loader: async () => ({ reports: await listFeedback({ data: { includeResolved: true } }) }),
  component: FeedbackPage,
})

function timeAgo(date: Date | string | null) {
  if (!date) return ''
  const then = new Date(date).getTime()
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function FeedbackPage() {
  const { reports } = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [showResolved, setShowResolved] = useState(false)

  const open = reports.filter((r) => !r.resolvedAt)
  const resolved = reports.filter((r) => r.resolvedAt)
  const shown = showResolved ? resolved : open

  const toggle = async (id: number, resolvedNow: boolean) => {
    setBusy(true)
    try {
      await setFeedbackResolved({ data: { feedbackId: id, resolved: resolvedNow } })
      await router.invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/admin' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
          <p className="text-gray-500">What reps have reported from the field</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={showResolved ? 'outline' : 'default'} size="sm" onClick={() => setShowResolved(false)}>
          Open ({open.length})
        </Button>
        <Button variant={showResolved ? 'default' : 'outline'} size="sm" onClick={() => setShowResolved(true)}>
          Done ({resolved.length})
        </Button>
      </div>

      {shown.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            {showResolved ? 'Nothing marked done yet.' : 'Nothing reported. That is good news.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map((report) => (
            <Card key={report.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex-1">
                  <CardTitle className="text-base font-normal whitespace-pre-wrap">
                    {report.message}
                  </CardTitle>
                  <CardDescription className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {report.representative?.name ?? 'Unknown'}
                    </span>
                    <span>{timeAgo(report.createdAt)}</span>
                    {report.customer && (
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={() =>
                          navigate({
                            to: '/customers/$customerId',
                            params: { customerId: String(report.customer!.id) },
                          })
                        }
                      >
                        {report.customer.name}
                      </button>
                    )}
                    {report.path && <code className="text-gray-400">{report.path}</code>}
                    {report.appVersion && (
                      <span className="text-gray-400">build {report.appVersion}</span>
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  title={report.resolvedAt ? 'Reopen' : 'Mark done'}
                  onClick={() => toggle(report.id, !report.resolvedAt)}
                >
                  {report.resolvedAt ? (
                    <RotateCcw className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </Button>
              </CardHeader>
              {report.userAgent && (
                <CardContent className="pt-0">
                  <p className="truncate text-[11px] text-gray-400">{report.userAgent}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
