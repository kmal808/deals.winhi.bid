import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getSession } from '@/server/functions/auth'

/**
 * Layout route guarding every /admin screen.
 *
 * Hiding the nav link is not access control — without this, any signed-in
 * representative could reach the configuration pages by typing the URL. The
 * matching server-side check lives in `adminMiddleware`; this one only spares
 * non-admins a screen full of failed requests.
 */
export const Route = createFileRoute('/_protected/admin')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    if (session.role !== 'admin') {
      throw redirect({ to: '/customers' })
    }
    return { session }
  },
  component: () => <Outlet />,
})
