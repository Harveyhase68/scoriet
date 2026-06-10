import { useCallback, useEffect, useState } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '../api/client'
import type { {:filesingularpascalcase:}, Page } from '../api/types'
{:if hasforeignkeys:}
import { entityLabel } from '../format'
{:endif:}
import AppLayout from '../AppLayout'
import {:filesingularpascalcase:}Dialog from '../{:filename:}/{:filesingularpascalcase:}Dialog'

const PAGE_SIZE = 10

export default function {:filepascalcase:}Page() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<Page<{:filesingularpascalcase:}> | null>(null)
  const [error, setError] = useState<string | null>(null)

  // combined create/edit dialog: 'new' = create, number = edit that record
  const [dialog, setDialog] = useState<'new' | number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{:filesingularpascalcase:} | null>(null)

  const loadTable = useCallback(async (searchValue: string, pageValue: number) => {
    try {
      const params = new URLSearchParams({ search: searchValue, page: String(pageValue), size: String(PAGE_SIZE) })
      setData(await api<Page<{:filesingularpascalcase:}>>(`/api/{:filename:}?${params}`))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  // debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    void loadTable(debouncedSearch, page)
  }, [debouncedSearch, page, loadTable])

  const refresh = () => void loadTable(debouncedSearch, page)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await api<void>(`/api/{:filename:}/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleteTarget(null)
    refresh()
  }

  return (
    <AppLayout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{:filepascalcase:}</h1>
        <Button onClick={() => setDialog('new')}>
          <PlusIcon />
          New {:filesingularlower:}
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        <div className="border-b p-4">
          <div className="relative w-full max-w-md">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              type="search"
              className="pl-9"
              placeholder="Search..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
            />
          </div>
        </div>

        {error && <p className="text-destructive p-4">{error}</p>}

        <Table>
          <TableHeader>
            <TableRow>
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
              <TableHead>{:item.caption:}</TableHead>
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
              <TableHead>{:foreign.referencedtablesingularpascalcase:}</TableHead>
{:endfor:}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.content.map((row) => (
              <TableRow key={row.id}>
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
                <TableCell>{row.{:item.camelcase:}}</TableCell>
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
                <TableCell>{entityLabel(row.{:foreign.referencedtablesingularcamelcase:})}</TableCell>
{:endfor:}
                <TableCell className="text-right whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-primary"
                    title="Edit"
                    onClick={() => setDialog(row.id)}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    title="Delete"
                    onClick={() => setDeleteTarget(row)}
                  >
                    <Trash2Icon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {data?.totalElements === 0 && (
              <TableRow>
                <TableCell colSpan={99} className="text-muted-foreground py-12 text-center">
                  <InboxIcon className="mx-auto mb-2 size-12" />
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t p-4">
          <span className="text-muted-foreground text-sm">
            {data?.totalElements ?? 0} record(s)
          </span>
          {data && data.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                title="Previous page"
                disabled={data.first}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeftIcon />
              </Button>
              {Array.from({ length: data.totalPages }, (_, index) => (
                <Button
                  key={index}
                  variant={index === data.page ? 'outline' : 'ghost'}
                  size="icon-sm"
                  onClick={() => setPage(index)}
                >
                  {index + 1}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="icon-sm"
                title="Next page"
                disabled={data.last}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRightIcon />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {dialog !== null && (
        <{:filesingularpascalcase:}Dialog
          recordId={dialog === 'new' ? null : dialog}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null)
            refresh()
          }}
        />
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {:filesingularlower:}</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this {:filesingularlower:} (#{deleteTarget?.id})? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => void confirmDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
