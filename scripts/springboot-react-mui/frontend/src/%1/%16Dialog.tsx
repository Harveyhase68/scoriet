import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
{:if hasforeignkeys:}
import MenuItem from '@mui/material/MenuItem'
{:endif:}
import TextField from '@mui/material/TextField'
import CheckIcon from '@mui/icons-material/Check'
import { api, ApiError } from '../api/client'
import type { {:filesingularpascalcase:}, {:filesingularpascalcase:}Request{:for nmaxforeignkeys:}, {:foreign.referencedtablesingularpascalcase:}{:endfor:} } from '../api/types'
{:if hasforeignkeys:}
import { entityLabel } from '../format'
{:endif:}

interface Props {
  /** null = create, otherwise the record id to edit. */
  recordId: number | null
  onClose: () => void
  onSaved: () => void
}

const EMPTY_FORM: {:filesingularpascalcase:}Request = {
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
{:if item.javatype eq "String":}
  {:item.camelcase:}: '',
{:else:}
  {:item.camelcase:}: 0,
{:endif:}
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
  {:foreign.referencedtablesingularcamelcase:}Id: null,
{:endfor:}
}

/** Combined create/edit dialog. */
export default function {:filesingularpascalcase:}Dialog({ recordId, onClose, onSaved }: Props) {
  const isNew = recordId === null
  const [form, setForm] = useState<{:filesingularpascalcase:}Request>(EMPTY_FORM)
{:for nmaxforeignkeys:}
  const [{:foreign.referencedtablesingularcamelcase:}Options, set{:foreign.referencedtablesingularpascalcase:}Options] = useState<{:foreign.referencedtablesingularpascalcase:}[]>([])
{:endfor:}
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
{:for nmaxforeignkeys:}
        const {:foreign.referencedtablesingularcamelcase:}Data = await api<{:foreign.referencedtablesingularpascalcase:}[]>('/api/{:foreign.referencedtable:}/all')
        if (!cancelled) set{:foreign.referencedtablesingularpascalcase:}Options({:foreign.referencedtablesingularcamelcase:}Data)
{:endfor:}
        if (recordId !== null) {
          const record = await api<{:filesingularpascalcase:}>(`/api/{:filename:}/${recordId}`)
          if (!cancelled) {
            setForm({
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
{:if item.javatype eq "String":}
              {:item.camelcase:}: record.{:item.camelcase:} ?? '',
{:else:}
              {:item.camelcase:}: record.{:item.camelcase:} ?? 0,
{:endif:}
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
              {:foreign.referencedtablesingularcamelcase:}Id: record.{:foreign.referencedtablesingularcamelcase:}?.id ?? null,
{:endfor:}
            })
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [recordId])

  const set = <K extends keyof {:filesingularpascalcase:}Request>(key: K, value: {:filesingularpascalcase:}Request[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setFieldErrors({})
    try {
      if (isNew) {
        await api<{:filesingularpascalcase:}>('/api/{:filename:}', { method: 'POST', body: form })
      } else {
        await api<{:filesingularpascalcase:}>(`/api/{:filename:}/${recordId}`, { method: 'PUT', body: form })
      }
      onSaved()
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.fieldErrors) {
        setFieldErrors(err.fieldErrors)
      } else {
        setError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={(event) => void submit(event)} noValidate>
        <DialogTitle>{isNew ? 'New {:filesingularlower:}' : 'Edit {:filesingularlower:}'}</DialogTitle>

        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mt: 0.5 }}>
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
                <TextField
                  label="{:item.caption:}"
{:if item.notnull:}
                  required
{:endif:}
{:if item.isblob:}
                  multiline
                  rows={3}
                  sx={{ gridColumn: { sm: 'span 2' } }}
{:endif:}
{:if item.javatype eq "String":}
                  value={form.{:item.camelcase:}}
                  onChange={(event) => set('{:item.camelcase:}', event.target.value)}
{:else:}
                  type="number"
                  value={form.{:item.camelcase:}}
                  onChange={(event) => set('{:item.camelcase:}', Number(event.target.value))}
{:endif:}
                  error={!!fieldErrors.{:item.camelcase:}}
                  helperText={fieldErrors.{:item.camelcase:}}
                />
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
                <TextField
                  label="{:foreign.referencedtablesingularpascalcase:}"
                  select
                  value={form.{:foreign.referencedtablesingularcamelcase:}Id ?? ''}
                  onChange={(event) => set('{:foreign.referencedtablesingularcamelcase:}Id', event.target.value === '' ? null : Number(event.target.value))}
                >
                  <MenuItem value="">&mdash; none &mdash;</MenuItem>
                  {{:foreign.referencedtablesingularcamelcase:}Options.map((option) => (
                    <MenuItem key={option.id} value={option.id}>{entityLabel(option)}</MenuItem>
                  ))}
                </TextField>
{:endfor:}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions>
          {saving && <CircularProgress size={20} sx={{ mr: 'auto', ml: 1 }} />}
          <Button color="inherit" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" startIcon={<CheckIcon />} disabled={loading || saving}>
            {isNew ? 'Create' : 'Save changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
