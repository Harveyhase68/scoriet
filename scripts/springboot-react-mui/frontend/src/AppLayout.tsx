import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import LogoutIcon from '@mui/icons-material/Logout'
import WidgetsIcon from '@mui/icons-material/Widgets'
import { useApp } from './AppContext'

/** App chrome: top navigation bar with brand, nav links and the logout button. */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useApp()
  const navigate = useNavigate()

  const signOut = async () => {
    await logout()
    navigate('/login?logout')
  }

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <WidgetsIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="span" sx={{ mr: 3 }}>
            {:projectcaption:}
          </Typography>
{:for nmaxtables:}
{:if form_set_name ne '':}
          <Button color="inherit" onClick={() => navigate('/{:filename:}')}>{:filepascalcase:}</Button>
{:endif:}
{:endfor:}
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            {user?.displayName ?? user?.username}
          </Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={() => void signOut()}>
            Sign out
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 4 }}>{children}</Container>
    </>
  )
}
