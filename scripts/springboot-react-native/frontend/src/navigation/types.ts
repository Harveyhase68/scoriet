import type { NativeStackScreenProps } from '@react-navigation/native-stack'

/** Routes of the authenticated app stack (one List/Form/Detail trio per master table). */
export type RootStackParamList = {
{:for nmaxtables:}
{:if form_set_name ne '':}
  {:filepascalcase:}: undefined
  /** No id = create, otherwise edit that record. */
  {:filesingularpascalcase:}Form: { id?: number } | undefined
  {:filesingularpascalcase:}Detail: { id: number }
{:endif:}
{:endfor:}
}

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>
