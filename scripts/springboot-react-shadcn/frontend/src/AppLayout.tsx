import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BlocksIcon, LogOutIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      <header className="bg-card border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <span className="flex items-center gap-2 text-lg font-semibold">
            <BlocksIcon className="text-primary size-5" />
            {:projectcaption:}
          </span>
{:for nmaxtables:}
{:if form_set_name ne '':}
          <Button variant="ghost" onClick={() => navigate('/{:filename:}')}>{:filepascalcase:}</Button>
{:endif:}
{:endfor:}
          <div className="flex-1" />
          <span className="text-muted-foreground text-sm">
            {user?.displayName ?? user?.username}
          </span>
          <Button variant="ghost" onClick={() => void signOut()}>
            <LogOutIcon />
            Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  )
}
