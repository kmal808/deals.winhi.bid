import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { MessageCircleWarning, Send, X } from 'lucide-react'
import { submitFeedback } from '@/server/functions/feedback'

/**
 * "Something's wrong" — one button, one box.
 *
 * Reps are in the field, mid-job, usually on a tablet. They will not file a bug
 * report, and they will not know to mention which screen they were on or which
 * job was open, so the app records that itself and asks one plain question.
 *
 * Reports are queued in localStorage and retried, because the moment the app is
 * misbehaving is exactly the moment the network might be too, and a report lost
 * to one bar of signal is worse than no button at all.
 */

const QUEUE_KEY = 'feedback-queue'

interface QueuedReport {
  message: string
  path: string
  customerId: number | null
  userAgent: string
  queuedAt: number
}

function readQueue(): QueuedReport[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeQueue(items: QueuedReport[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
  } catch {
    // A full or disabled localStorage should not break the form.
  }
}

/** The customer id out of a /customers/123 or /configurator/123 path. */
function customerIdFromPath(path: string): number | null {
  const match = /\/(?:customers|configurator)\/(\d+)/.exec(path)
  return match ? Number(match[1]) : null
}

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const path = useRouterState({ select: (s) => s.location.pathname })

  // Anything stranded by a dropped connection goes out on the next load.
  useEffect(() => {
    const queued = readQueue()
    if (queued.length === 0) return

    let cancelled = false
    void (async () => {
      const stillQueued: QueuedReport[] = []
      for (const report of queued) {
        try {
          await submitFeedback({ data: report })
        } catch {
          stillQueued.push(report)
        }
      }
      if (cancelled) return
      writeQueue(stillQueued)
      const sent = queued.length - stillQueued.length
      if (sent > 0) {
        toast.success(`${sent} earlier note${sent === 1 ? '' : 's'} sent`)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const send = async () => {
    const text = message.trim()
    if (!text) return

    const report: QueuedReport = {
      message: text,
      path,
      customerId: customerIdFromPath(path),
      userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent.slice(0, 500),
      queuedAt: Date.now(),
    }

    setSending(true)
    try {
      await submitFeedback({ data: report })
      toast.success('Thanks — that went through')
    } catch {
      // Keep it rather than lose it; it goes out next time the app loads.
      writeQueue([...readQueue(), report])
      toast.success('Saved. It will send when you are back on signal.')
    } finally {
      setSending(false)
      setMessage('')
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-gray-800"
      >
        <MessageCircleWarning className="h-4 w-4" />
        Something&rsquo;s wrong
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">Tell us what happened</p>
          <p className="text-xs text-gray-500">
            No need for detail — we can see what screen you were on.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        autoFocus
        placeholder="The price looked wrong on the second window…"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />

      <div className="mt-2 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={send} disabled={sending || !message.trim()}>
          <Send className="mr-2 h-4 w-4" />
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </div>
  )
}
