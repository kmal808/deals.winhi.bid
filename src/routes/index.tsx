import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '@/server/functions/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await getSession()
    if (session) {
      throw redirect({ to: '/customers' })
    } else {
      throw redirect({ to: '/login' })
    }
  },
})
