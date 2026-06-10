import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../auth/AuthContext'
import { MENU_ITEMS } from '../navigation/menu'
import type { RootStackParamList } from '../navigation/types'
import { colors, radius, spacing } from '../theme'

interface Props {
  visible: boolean
  onClose: () => void
  /** Navigate to a master table's list screen. */
  onNavigate: (route: keyof RootStackParamList) => void
  /** Route of the currently shown table (highlighted in the menu). */
  activeRoute: keyof RootStackParamList
}

/**
 * Slide-over hamburger menu (the RN equivalent of the web top-nav): one entry per
 * master table plus a sign-out action. Built on the core React Native Modal so it
 * needs no extra navigation/animation dependencies.
 */
export default function AppMenu({ visible, onClose, onNavigate, activeRoute }: Props) {
  const { logout } = useAuth()

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* swallow taps on the panel so they don't close the menu */}
        <Pressable style={styles.panel} onPress={() => {}}>
          <Text style={styles.heading}>Menu</Text>

          {MENU_ITEMS.map((item) => {
            const active = item.route === activeRoute
            return (
              <Pressable
                key={item.route}
                style={[styles.item, active ? styles.itemActive : null]}
                onPress={() => {
                  onClose()
                  if (!active) onNavigate(item.route)
                }}
              >
                <Ionicons
                  name="folder-outline"
                  size={20}
                  color={active ? colors.primary : colors.text}
                />
                <Text style={[styles.itemLabel, active ? styles.itemLabelActive : null]}>{item.label}</Text>
              </Pressable>
            )
          })}

          <View style={styles.divider} />

          <Pressable
            style={styles.item}
            onPress={() => {
              onClose()
              void logout()
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
            <Text style={[styles.itemLabel, { color: colors.destructive }]}>Sign out</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.35)' },
  panel: {
    width: '74%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: colors.card,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  itemActive: { backgroundColor: colors.mutedSurface },
  itemLabel: { fontSize: 16, color: colors.text },
  itemLabelActive: { color: colors.primary, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
})
