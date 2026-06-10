import { StyleSheet, Text, TextInput, View } from 'react-native'
import type { KeyboardTypeOptions } from 'react-native'
import { colors, radius, spacing } from '../theme'

interface Props {
  label: string
  value: string
  onChangeText: (text: string) => void
  /** Server validation message (422 fieldErrors) shown in red below the input. */
  error?: string
  placeholder?: string
  secureTextEntry?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  keyboardType?: KeyboardTypeOptions
  multiline?: boolean
  autoFocus?: boolean
}

/** Labelled text input + server validation error (the RN version of the web Field wrapper). */
export default function TextField({
  label, value, onChangeText, error, placeholder,
  secureTextEntry, autoCapitalize, keyboardType, multiline, autoFocus,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline ? styles.multiline : null, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        autoFocus={autoFocus}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  inputError: { borderColor: colors.destructive },
  error: { color: colors.destructive, fontSize: 13 },
})
