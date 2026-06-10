import { Loader2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Simple loading spinner (replaces MUI's CircularProgress). */
function Spinner({ className }: { className?: string }) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn('text-muted-foreground size-6 animate-spin', className)}
    />
  )
}

export { Spinner }
