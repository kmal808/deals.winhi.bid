import { useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryProps {
  error: Error
  reset?: () => void
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter()

  const handleReset = () => {
    if (reset) {
      reset()
    } else {
      router.invalidate()
    }
  }

  const handleHome = () => {
    router.navigate({ to: '/customers' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            An error occurred while loading this page. Please try again.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-xs font-mono text-red-700 break-all">{error.message}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleReset} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={handleHome} className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function NotFoundBoundary() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl font-bold text-gray-400">404</span>
          </div>
          <CardTitle className="text-xl text-gray-900">Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <Button
            onClick={() => router.navigate({ to: '/customers' })}
            className="w-full"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Customers
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
