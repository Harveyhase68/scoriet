import { StyleSheet, View } from 'react-native'
import type { ReactNode } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing } from '../theme'

/** Full-screen, vertically/horizontally centred container used by status screens. */
export default function Centered({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
})
