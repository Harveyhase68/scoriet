import type { RootStackParamList } from './types'

/** One entry per master table — drives the app's hamburger menu (AppMenu). */
export const MENU_ITEMS: { route: keyof RootStackParamList; label: string }[] = [
{:for nmaxtables:}
{:if form_set_name ne '':}
  { route: '{:filepascalcase:}', label: '{:filepascalcase:}' },
{:endif:}
{:endfor:}
]
