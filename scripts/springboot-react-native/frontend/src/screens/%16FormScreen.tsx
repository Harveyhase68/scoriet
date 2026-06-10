{:if form_set_name ne '':}
import { useEffect, useLayoutEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { api, ApiError } from '../api/client'
import type { {:filesingularpascalcase:}, {:filesingularpascalcase:}Request{:for nmaxforeignkeys:}, {:foreign.referencedtablesingularpascalcase:}{:endfor:} } from '../api/types'
import Button from '../components/Button'
import TextField from '../components/TextField'
{:if hasforeignkeys:}
import PickerField from '../components/PickerField'
import type { PickerOption } from '../components/PickerField'
import { entityLabel } from '../format'
{:endif:}
import { colors, spacing } from '../theme'
import type { ScreenProps } from '../navigation/types'

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
/** Sentinel for "no selection" in a PickerField. */
const NONE = ''
{:endif:}

export default function {:filesingularpascalcase:}FormScreen({ navigation, route }: ScreenProps<'{:filesingularpascalcase:}Form'>) {
  const recordId = route.params?.id ?? null
  const isNew = recordId === null

  const [form, setForm] = useState<{:filesingularpascalcase:}Request>(EMPTY_FORM)
{:for nmaxforeignkeys:}
  const [{:foreign.referencedtablesingularcamelcase:}List, set{:foreign.referencedtablesingularpascalcase:}List] = useState<{:foreign.referencedtablesingularpascalcase:}[]>([])
{:endfor:}
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useLayoutEffect(() => {
    navigation.setOptions({ title: isNew ? 'New {:filesingularlower:}' : 'Edit {:filesingularlower:}' })
  }, [navigation, isNew])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
{:for nmaxforeignkeys:}
        const {:foreign.referencedtablesingularcamelcase:}Data = await api<{:foreign.referencedtablesingularpascalcase:}[]>('/api/{:foreign.referencedtable:}/all')
        if (!cancelled) set{:foreign.referencedtablesingularpascalcase:}List({:foreign.referencedtablesingularcamelcase:}Data)
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

  const submit = async () => {
    setSaving(true)
    setError(null)
    setFieldErrors({})
    try {
      if (isNew) {
        await api<{:filesingularpascalcase:}>('/api/{:filename:}', { method: 'POST', body: form })
      } else {
        await api<{:filesingularpascalcase:}>(`/api/{:filename:}/${recordId}`, { method: 'PUT', body: form })
      }
      navigation.goBack()
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

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
  }

{:for nmaxforeignkeys:}
  const {:foreign.referencedtablesingularcamelcase:}Options: PickerOption[] = [
    { label: '— none —', value: NONE },
    ...{:foreign.referencedtablesingularcamelcase:}List.map((opt) => ({ label: entityLabel(opt), value: String(opt.id) })),
  ]
{:endfor:}

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {error ? <Text style={styles.error}>{error}</Text> : null}

{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
      <TextField
        label="{:item.caption:}"
{:if item.javatype eq "String":}
        value={form.{:item.camelcase:}}
        onChangeText={(value) => set('{:item.camelcase:}', value)}
{:else:}
        value={String(form.{:item.camelcase:})}
        keyboardType="numeric"
        onChangeText={(value) => set('{:item.camelcase:}', Number(value))}
{:endif:}
{:if item.isblob:}
        multiline
{:endif:}
        error={fieldErrors.{:item.camelcase:}}
      />
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
      <PickerField
        label="{:foreign.referencedtablesingularpascalcase:}"
        selectedValue={form.{:foreign.referencedtablesingularcamelcase:}Id === null ? NONE : String(form.{:foreign.referencedtablesingularcamelcase:}Id)}
        onValueChange={(value) => set('{:foreign.referencedtablesingularcamelcase:}Id', value === NONE ? null : Number(value))}
        options={{:foreign.referencedtablesingularcamelcase:}Options}
      />
{:endfor:}

      <View style={styles.actions}>
        <Button title="Cancel" variant="outline" onPress={() => navigation.goBack()} style={styles.flex} />
        <Button
          title={isNew ? 'Create' : 'Save'}
          onPress={submit}
          loading={saving}
          style={styles.flex}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loader: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.lg, backgroundColor: colors.background },
  error: { color: colors.destructive },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, marginBottom: spacing.xl },
  flex: { flex: 1 },
})
{:endif:}
