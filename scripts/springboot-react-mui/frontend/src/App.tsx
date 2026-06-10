import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 12 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (backendError) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', mt: 12, px: 2 }}>
        <Alert severity="error" onClose={() => void refreshSetup()}>
          Cannot reach the backend: {backendError} — is Spring Boot running on port 8080?
        </Alert>
      </Box>
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
