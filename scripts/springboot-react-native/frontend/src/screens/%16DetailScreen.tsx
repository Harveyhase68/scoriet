{:if form_set_name ne '':}
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { api } from '../api/client'
import type { {:filesingularpascalcase:} } from '../api/types'
import Button from '../components/Button'
{:if hasforeignkeys:}
import { entityLabel } from '../format'
{:endif:}
{:if hastimestamps:}
import { formatDateTime } from '../format'
{:endif:}
import { colors, radius, spacing } from '../theme'
import type { ScreenProps } from '../navigation/types'

const DASH = '—'

/** Read-only data sheet for a single record. */
export default function {:filesingularpascalcase:}DetailScreen({ navigation, route }: ScreenProps<'{:filesingularpascalcase:}Detail'>) {
  const { id } = route.params
  const [record, setRecord] = useState<{:filesingularpascalcase:} | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const reload = () => {
      void api<{:filesingularpascalcase:}>(`/api/{:filename:}/${id}`)
        .then(setRecord)
        .catch((err) => setError(err instanceof Error ? err.message : String(err)))
    }
    reload() // initial load
    return navigation.addListener('focus', reload) // reload after returning from edit
  }, [id, navigation])

  if (error) {
    return <Text style={styles.error}>{error}</Text>
  }
  if (!record) {
    return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Section title="Details">
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
        <Row label="{:item.caption:}" value={record.{:item.camelcase:}} />
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
        <Row label="{:foreign.referencedtablesingularpascalcase:}" value={entityLabel(record.{:foreign.referencedtablesingularcamelcase:})} />
{:endfor:}
      </Section>

{:if hastimestamps:}
      <View style={styles.timestamps}>
        <Text style={styles.timestamp}>Created: {formatDateTime(record.createdAt)}</Text>
        <Text style={styles.timestamp}>Updated: {formatDateTime(record.updatedAt)}</Text>
      </View>
{:endif:}

      <View style={styles.actions}>
        <Button
          title="Edit"
          onPress={() => navigation.navigate('{:filesingularpascalcase:}Form', { id })}
          style={styles.flex}
        />
      </View>
    </ScrollView>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  )
}

function Row({ label, value }: { label: string; value: unknown }) {
  const text = value == null || value === '' ? DASH : String(value)
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  loader: { flex: 1, backgroundColor: colors.background },
  error: { color: colors.destructive, padding: spacing.lg },
  scroll: { padding: spacing.lg, gap: spacing.lg, backgroundColor: colors.background },
  section: { gap: spacing.xs },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  sectionCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { width: '38%', fontSize: 14, fontWeight: '600', color: colors.text },
  rowValue: { flex: 1, fontSize: 14, color: colors.text },
  timestamps: { flexDirection: 'row', justifyContent: 'space-between' },
  timestamp: { fontSize: 12, color: colors.muted },
  actions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  flex: { flex: 1 },
})
{:endif:}
