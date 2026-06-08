import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import StorageIcon from '@mui/icons-material/Storage'
import RefreshIcon from '@mui/icons-material/Refresh'
import WidgetsIcon from '@mui/icons-material/Widgets'
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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
      <Box sx={{ maxWidth: 560, width: '100%' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <WidgetsIcon color="primary" sx={{ fontSize: 56 }} />
          <Typography variant="h5" component="h1">{:projectcaption:}</Typography>
        </Box>

        <Card elevation={2}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              First-time setup
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              The database tables do not exist yet. This wizard creates all tables
              (<code>customers</code>, <code>postal_codes</code>, <code>companies</code>, <code>users</code>),
              loads a few sample records and creates the initial login <strong>admin&nbsp;/&nbsp;admin</strong>.
            </Typography>

            <Typography variant="subtitle2">Database connection</Typography>
            <Typography variant="body2" component="code" sx={{ wordBreak: 'break-all', display: 'block', mb: 2 }}>
              {setup?.datasourceUrl}
            </Typography>

            {setup?.connectionError == null ? (
              <Alert severity="success" sx={{ mb: 2 }}>Connected to MySQL.</Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>Cannot connect to MySQL</AlertTitle>
                <Typography variant="body2">{setup.connectionError}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Please make sure the WampServer MySQL service is running and the credentials in{' '}
                  <code>src/main/resources/application.properties</code> are correct, then re-check.
                </Typography>
              </Alert>
            )}

            {installError && <Alert severity="error" sx={{ mb: 2 }}>{installError}</Alert>}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<StorageIcon />}
                disabled={setup?.connectionError != null || installing}
                onClick={() => void install()}
              >
                {installing ? 'Creating tables…' : 'Create tables & sample data'}
              </Button>
              <IconButton title="Re-check connection" onClick={() => void refreshSetup()}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          After the setup you will be redirected to the login page.
        </Typography>
      </Box>
    </Box>
  )
}
