import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import LoginIcon from '@mui/icons-material/Login'
import WidgetsIcon from '@mui/icons-material/Widgets'
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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
      <Box sx={{ maxWidth: 400, width: '100%' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <WidgetsIcon color="primary" sx={{ fontSize: 56 }} />
          <Typography variant="h5" component="h1">{:projectcaption:}</Typography>
        </Box>

        <Card elevation={2}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Sign in
            </Typography>

            {searchParams.has('setup') && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Setup complete. Sign in with <strong>admin / admin</strong>.
              </Alert>
            )}
            {searchParams.has('logout') && (
              <Alert severity="info" sx={{ mb: 2 }}>You have been signed out.</Alert>
            )}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={(event) => void submit(event)}>
              <TextField
                label="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                fullWidth
                required
                autoFocus
                margin="normal"
                autoComplete="username"
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                fullWidth
                required
                margin="normal"
                autoComplete="current-password"
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                startIcon={<LoginIcon />}
                disabled={submitting}
                sx={{ mt: 2 }}
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
