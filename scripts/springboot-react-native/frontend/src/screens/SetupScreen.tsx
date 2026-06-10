import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Centered from '../components/Centered'
import Button from '../components/Button'
import { useAuth } from '../auth/AuthContext'
import { colors, spacing } from '../theme'

/**
 * First-run fallback (not a full wizard): the backend reports the DB tables do not
 * exist yet, so offer a single button that creates them + the admin/admin login.
 */
export default function SetupScreen() {
  const { setup, runSetup, bootstrap } = useAuth()
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canInstall = setup?.connectionError == null

  const install = async () => {
    setInstalling(true)
    setError(null)
    try {
      await runSetup()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setInstalling(false)
    }
  }

  return (
    <Centered>
      <Text style={styles.title}>First-time setup</Text>
      <Text style={styles.body}>
        The database tables do not exist yet. This creates all tables, a few sample records and the
        initial login admin / admin.
      </Text>

      <View style={styles.connBox}>
        <Text style={styles.connLabel}>Database connection</Text>
        <Text style={styles.connUrl}>{setup?.datasourceUrl}</Text>
        {canInstall ? (
          <Text style={[styles.connState, { color: colors.success }]}>Connected to MySQL.</Text>
        ) : (
          <Text style={[styles.connState, { color: colors.destructive }]}>
            Cannot connect to MySQL: {setup?.connectionError}
          </Text>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={installing ? 'Creating tables…' : 'Create tables & sample data'}
        onPress={install}
        loading={installing}
        disabled={!canInstall}
        style={styles.fullWidth}
      />
      <Button title="Re-check connection" variant="outline" onPress={() => void bootstrap()} style={styles.fullWidth} />
    </Centered>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  connBox: {
    width: '100%',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  connLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  connUrl: { fontSize: 12, color: colors.muted },
  connState: { fontSize: 14, marginTop: spacing.xs },
  error: { color: colors.destructive, textAlign: 'center' },
  fullWidth: { width: '100%' },
})
