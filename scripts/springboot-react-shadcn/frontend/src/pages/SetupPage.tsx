import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AlertCircleIcon, BlocksIcon, CheckCircle2Icon, DatabaseIcon, RefreshCwIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '../api/client'
import { useApp } from '../AppContext'

/** First-run wizard: creates the tables, sample data and the admin/admin login. */
export default function SetupPage() {
  const { setup, refreshSetup } = useApp()
  const navigate = useNavigate()
  const [installing, setInstalling] = useState(false)
  const [installError, setInstallError] = useState<string | null>(null)

  if (setup?.installed) {
    return <Navigate to="/" replace />
  }

  const install = async () => {
    setInstalling(true)
    setInstallError(null)
    try {
      await api<void>('/api/setup/install', { method: 'POST' })
      await refreshSetup()
      navigate('/login?setup')
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : String(error))
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <BlocksIcon className="text-primary mx-auto size-14" />
          <h1 className="text-2xl font-semibold">{:projectcaption:}</h1>
        </div>

        <Card>
          <CardContent>
            <h2 className="mb-2 text-lg font-semibold">First-time setup</h2>

            <p className="text-muted-foreground mb-4 text-sm">
              The database tables do not exist yet. This wizard creates all tables,
              loads a few sample records and creates the initial login <strong>admin&nbsp;/&nbsp;admin</strong>.
            </p>

            <h3 className="text-sm font-medium">Database connection</h3>
            <code className="mb-4 block text-sm break-all">{setup?.datasourceUrl}</code>

            {setup?.connectionError == null ? (
              <Alert variant="success" className="mb-4">
                <CheckCircle2Icon />
                <AlertDescription>Connected to MySQL.</AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive" className="mb-4">
                <AlertCircleIcon />
                <AlertTitle>Cannot connect to MySQL</AlertTitle>
                <AlertDescription>
                  <p>{setup.connectionError}</p>
                  <p>
                    Please make sure the WampServer MySQL service is running and the credentials in{' '}
                    <code>src/main/resources/application.properties</code> are correct, then re-check.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {installError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircleIcon />
                <AlertDescription>{installError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={setup?.connectionError != null || installing}
                onClick={() => void install()}
              >
                <DatabaseIcon />
                {installing ? 'Creating tables…' : 'Create tables & sample data'}
              </Button>
              <Button variant="outline" size="icon" title="Re-check connection" onClick={() => void refreshSetup()}>
                <RefreshCwIcon />
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-muted-foreground mt-4 text-center text-sm">
          After the setup you will be redirected to the login page.
        </p>
      </div>
    </div>
  )
}
