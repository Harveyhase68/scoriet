import { useEffect, useId, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { AlertCircleIcon, CheckIcon, PencilIcon, PlusIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
{:if hasforeignkeys:}
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
{:endif:}
import { Spinner } from '@/components/ui/spinner'
{:if hasblob:}
import { Textarea } from '@/components/ui/textarea'
{:endif:}
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

{:if hasforeignkeys:}
/** Sentinel for "no selection" — Radix Select items must not have an empty value. */
const NONE = 'none'
{:endif:}

/** Static classes so the Tailwind scanner picks them up (sm:col-span-${n} would not work). */
const SPAN_CLASS = {
  4: 'sm:col-span-4',
  6: 'sm:col-span-6',
  8: 'sm:col-span-8',
  12: 'sm:col-span-12',
} as const

/** Label + control + server validation error, spanning `span` of 12 grid columns. */
function Field({ label, htmlFor, error, span, children }: {
  label: string
  htmlFor: string
  error?: string
  span: keyof typeof SPAN_CLASS
  children: ReactNode
}) {
  return (
    <div className={`grid content-start gap-2 ${SPAN_CLASS[span]}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  )
}

/** Combined create/edit dialog. */
export default function {:filesingularpascalcase:}Dialog({ recordId, onClose, onSaved }: Props) {
  const isNew = recordId === null
  const id = useId()
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
    return () => {
      cancelled = true
    }
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <form onSubmit={(event) => void submit(event)} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isNew ? <PlusIcon className="size-5" /> : <PencilIcon className="size-5" />}
              {isNew ? 'New {:filesingularlower:}' : 'Edit {:filesingularlower:}'}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-8" />
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
{:if item.isblob:}
                <Field label="{:item.caption:}" htmlFor={`${id}-{:item.camelcase:}`} error={fieldErrors.{:item.camelcase:}} span={12}>
                  <Textarea
                    id={`${id}-{:item.camelcase:}`}
                    rows={3}
                    value={form.{:item.camelcase:}}
                    onChange={(event) => set('{:item.camelcase:}', event.target.value)}
                    aria-invalid={!!fieldErrors.{:item.camelcase:}}
                  />
                </Field>
{:else:}
                <Field label="{:item.caption:}" htmlFor={`${id}-{:item.camelcase:}`} error={fieldErrors.{:item.camelcase:}} span={6}>
                  <Input
                    id={`${id}-{:item.camelcase:}`}
{:if item.notnull:}
                    required
{:endif:}
{:if item.javatype eq "String":}
                    value={form.{:item.camelcase:}}
                    onChange={(event) => set('{:item.camelcase:}', event.target.value)}
{:else:}
                    type="number"
                    value={form.{:item.camelcase:}}
                    onChange={(event) => set('{:item.camelcase:}', Number(event.target.value))}
{:endif:}
                    aria-invalid={!!fieldErrors.{:item.camelcase:}}
                  />
                </Field>
{:endif:}
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
                <Field label="{:foreign.referencedtablesingularpascalcase:}" htmlFor={`${id}-{:foreign.referencedtablesingularcamelcase:}`} span={6}>
                  <Select
                    value={form.{:foreign.referencedtablesingularcamelcase:}Id?.toString() ?? NONE}
                    onValueChange={(value) => set('{:foreign.referencedtablesingularcamelcase:}Id', value === NONE ? null : Number(value))}
                  >
                    <SelectTrigger id={`${id}-{:foreign.referencedtablesingularcamelcase:}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— none —</SelectItem>
                      {{:foreign.referencedtablesingularcamelcase:}Options.map((option) => (
                        <SelectItem key={option.id} value={option.id.toString()}>{entityLabel(option)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
{:endfor:}
              </div>
            </>
          )}

          <DialogFooter>
            {saving && <Spinner className="mr-auto size-5 self-center" />}
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading || saving}>
              <CheckIcon />
              {isNew ? 'Create' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
