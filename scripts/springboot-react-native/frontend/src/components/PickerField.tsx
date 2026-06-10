import { Picker } from '@react-native-picker/picker'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing } from '../theme'

export interface PickerOption {
  label: string
  value: string
}

interface Props {
  label: string
  /** Selected option value; use '' / NONE for "no selection". */
  selectedValue: string
  onValueChange: (value: string) => void
  options: PickerOption[]
  error?: string
}

/** Labelled dropdown (the RN version of the web shadcn Select). */
export default function PickerField({ label, selectedValue, onValueChange, options, error }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, error ? styles.boxError : null]}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={(value) => onValueChange(String(value))}
          dropdownIconColor={colors.muted}
          style={Platform.OS === 'android' ? styles.androidPicker : undefined}
        >
          {options.map((option) => (
            <Picker.Item key={option.value} label={option.label} value={option.value} />
          ))}
        </Picker>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  box: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    justifyContent: 'center',
  },
  boxError: { borderColor: colors.destructive },
  androidPicker: { color: colors.text },
  error: { color: colors.destructive, fontSize: 13 },
})
