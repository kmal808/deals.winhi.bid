import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { getSession, performLogin } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createServerFn } from '@tanstack/react-start'

// Server function for login
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loginAction = createServerFn().handler(async (ctx: any) => {
  const { username, password } = ctx.data || ctx || {}

  if (!username || !password) {
    return { error: 'Username and password are required' }
  }

  try {
    await performLogin(username, password)
    return { success: true }
  } catch {
    return { error: 'Invalid username or password' }
  }
})

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    // Redirect to dashboard if already logged in
    const session = await getSession()
    if (session) {
      throw { redirect: { to: '/customers' } }
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (loginAction as any)({ data: { username, password } })
      if (result.error) {
        toast.error(result.error)
        setError(result.error)
      } else {
        toast.success('Welcome back!')
        router.navigate({ to: '/customers' })
      }
    } catch {
      toast.error('An error occurred')
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Windows Hawaii</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
