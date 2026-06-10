import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import { AlertCircleIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useApp } from './AppContext'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
{:for nmaxtables:}
{:if form_set_name ne '':}
import {:filepascalcase:}Page from './pages/{:filepascalcase:}Page'
{:endif:}
{:endfor:}

/** Redirects to /setup (wizard not run) or /login (not authenticated). */
function RequireAuth({ children }: { children: ReactElement }) {
  const { setup, user } = useApp()
  if (!setup?.installed) {
    return <Navigate to="/setup" replace />
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  const { loading, backendError, refreshSetup } = useApp()

  if (loading) {
    return (
      <div className="mt-24 flex justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (backendError) {
    return (
      <div className="mx-auto mt-24 max-w-xl px-4">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Cannot reach the backend</AlertTitle>
          <AlertDescription>
            <p>{backendError} — is Spring Boot running on port 8080?</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => void refreshSetup()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<LoginPage />} />
{:for nmaxtables:}
{:if form_set_name ne '':}
      <Route path="/{:filename:}" element={<RequireAuth><{:filepascalcase:}Page /></RequireAuth>} />
{:endif:}
{:endfor:}
{:code:}
var t = gtree[0].project[0].tables;
var landing = 'login';
for (var k = 0; k < t.length; k++) { if (t[k].form_set_name) { landing = t[k].filename; break; } }
sContentResult += '      <Route path="*" element={<Navigate to="/' + landing + '" replace />} />';
return sContentResult;
{:codeend:}
    </Routes>
  )
}
