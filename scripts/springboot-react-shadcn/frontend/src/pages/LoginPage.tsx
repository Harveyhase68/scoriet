import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircleIcon, BlocksIcon, CheckCircle2Icon, InfoIcon, LogInIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '../api/client'
import { useApp } from '../AppContext'

export default function LoginPage() {
  const { setup, user, login } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!setup?.installed) {
    return <Navigate to="/setup" replace />
  }
  if (user) {
    return <Navigate to="/" replace />
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401
        ? 'Invalid username or password.'
        : err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <BlocksIcon className="text-primary mx-auto size-14" />
          <h1 className="text-2xl font-semibold">{:projectcaption:}</h1>
        </div>

        <Card>
          <CardContent>
            <h2 className="mb-4 text-lg font-semibold">Sign in</h2>

            {searchParams.has('setup') && (
              <Alert variant="success" className="mb-4">
                <CheckCircle2Icon />
                <AlertDescription>
                  <p>Setup complete. Sign in with <strong>admin / admin</strong>.</p>
                </AlertDescription>
              </Alert>
            )}
            {searchParams.has('logout') && (
              <Alert variant="info" className="mb-4">
                <InfoIcon />
                <AlertDescription>You have been signed out.</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircleIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={(event) => void submit(event)} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="mt-2 w-full" disabled={submitting}>
                <LogInIcon />
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
