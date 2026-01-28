import { createFileRoute, Outlet, redirect, Link, useNavigate } from '@tanstack/react-router'
import { getSession, logout, type SessionData } from '@/server/functions/auth'
import { Button } from '@/components/ui/button'
import { LogOut, Users, Settings } from 'lucide-react'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    return { session }
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const { session } = Route.useRouteContext()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header session={session} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

function Header({
  session,
  onLogout,
}: {
  session: SessionData
  onLogout: () => void
}) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/customers" className="text-xl font-bold text-blue-600">
              Windows Hawaii
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/customers"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 [&.active]:bg-blue-50 [&.active]:text-blue-600"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Customers
                </span>
              </Link>

              {session.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 [&.active]:bg-blue-50 [&.active]:text-blue-600"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Admin
                  </span>
                </Link>
              )}
            </nav>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {session.name}
              <span className="ml-2 text-xs text-gray-400 capitalize">
                ({session.role})
              </span>
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
