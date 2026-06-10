/**
 * Central design tokens (the React Native equivalent of the web app's Tailwind/shadcn
 * theme). Screens and components read colours/spacing from here instead of hardcoding.
 */
export const colors = {
  primary: '#2563eb',
  primaryText: '#ffffff',
  background: '#f1f5f9',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  muted: '#64748b',
  mutedSurface: '#f8fafc',
  destructive: '#dc2626',
  destructiveSurface: '#fef2f2',
  success: '#16a34a',
  successSurface: '#f0fdf4',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
} as const
