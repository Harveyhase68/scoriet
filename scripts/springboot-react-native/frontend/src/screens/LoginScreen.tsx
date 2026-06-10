import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { colors, spacing } from '../theme'

/** Sign-in screen (the RN version of the web LoginPage). */
export default function LoginScreen() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await login(username, password)
      // on success AuthContext sets the user -> RootNavigator swaps to the app stack
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401
        ? 'Invalid username or password.'
        : err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Text style={styles.brandTitle}>{:projectcaption:}</Text>
            <Text style={styles.brandSub}>Sign in to continue</Text>
          </View>

          <View style={styles.card}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TextField
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoFocus
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Button
              title={submitting ? 'Signing in…' : 'Sign in'}
              onPress={submit}
              loading={submitting}
              disabled={!username || !password}
            />
            <Text style={styles.hint}>Default login after setup: admin / admin</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl },
  brand: { alignItems: 'center', gap: spacing.xs },
  brandTitle: { fontSize: 28, fontWeight: '700', color: colors.text },
  brandLight: { color: colors.muted, fontWeight: '400' },
  brandSub: { color: colors.muted },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  error: { color: colors.destructive },
  hint: { color: colors.muted, fontSize: 13, textAlign: 'center' },
})
