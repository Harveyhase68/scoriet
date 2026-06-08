import { useCallback, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Pagination from '@mui/material/Pagination'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import InboxIcon from '@mui/icons-material/Inbox'
import SearchIcon from '@mui/icons-material/Search'
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h5" component="h1">{:filepascalcase:}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog('new')}>
          New {:filesingularlower:}
        </Button>
      </Box>

      <Card elevation={2}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            type="search"
            size="small"
            placeholder="Search..."
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(0) }}
            sx={{ width: '100%', maxWidth: 420 }}
            slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) } }}
          />
        </Box>

        {error && <Typography color="error" sx={{ p: 2 }}>{error}</Typography>}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
                <TableCell>{:item.caption:}</TableCell>
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
                <TableCell>{:foreign.referencedtablesingularpascalcase:}</TableCell>
{:endfor:}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.content.map((row) => (
                <TableRow key={row.id} hover>
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
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton size="small" color="primary" title="Edit" onClick={() => setDialog(row.id)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" title="Delete" onClick={() => setDeleteTarget(row)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {data?.totalElements === 0 && (
                <TableRow>
                  <TableCell colSpan={99} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    <InboxIcon sx={{ fontSize: 48, display: 'block', mx: 'auto', mb: 1 }} />
                    No records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            {data?.totalElements ?? 0} record(s)
          </Typography>
          {data && data.totalPages > 1 && (
            <Pagination size="small" count={data.totalPages} page={data.page + 1} onChange={(_event, value) => setPage(value - 1)} />
          )}
        </Box>
      </Card>

      {dialog !== null && (
        <{:filesingularpascalcase:}Dialog
          recordId={dialog === 'new' ? null : dialog}
          onClose={() => setDialog(null)}
          onSaved={() => { setDialog(null); refresh() }}
        />
      )}

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete {:filesingularlower:}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete this {:filesingularlower:} (#{deleteTarget?.id})? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void confirmDelete()}>Delete</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  )
}
