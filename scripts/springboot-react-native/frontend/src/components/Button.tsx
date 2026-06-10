import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { colors, radius, spacing } from '../theme'

type Variant = 'primary' | 'outline' | 'ghost' | 'destructive'

interface Props {
  title: string
  onPress: () => void
  variant?: Variant
  disabled?: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
}

/** Themed pressable button mirroring the web app's shadcn Button variants. */
export default function Button({ title, onPress, variant = 'primary', disabled, loading, style }: Props) {
  const isDisabled = disabled || loading
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        VARIANT_STYLE[variant],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' || variant === 'destructive' ? colors.primaryText : colors.primary} />}
      <Text style={[styles.text, TEXT_STYLE[variant]]}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  text: { fontSize: 15, fontWeight: '600' },
})

const VARIANT_STYLE: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: colors.card, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  destructive: { backgroundColor: colors.destructive },
}

const TEXT_STYLE: Record<Variant, { color: string }> = {
  primary: { color: colors.primaryText },
  outline: { color: colors.text },
  ghost: { color: colors.primary },
  destructive: { color: colors.primaryText },
}
