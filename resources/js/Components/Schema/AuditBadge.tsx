import { useTheme } from '@/contexts/ThemeContext';

interface AuditBadgeProps {
  version?: number;
  createdAt?: string;
  createdByUsername?: string;
  updatedAt?: string;
  updatedByUsername?: string;
  // Optional inline override (e.g. for compact per-field rendering).
  compact?: boolean;
}

/**
 * Read-only audit chip — shows `v{version} · updated {date} by {username}`
 * with a hover tooltip revealing the full create/update quartet. Used in
 * the Database Manager's table modal and per-field row to surface the new
 * round-trip metadata without occupying real estate.
 *
 * The component is intentionally non-interactive: audit/version are
 * server-managed and reset/bump automatically. Users only see them.
 */
export function AuditBadge({
  version,
  createdAt,
  createdByUsername,
  updatedAt,
  updatedByUsername,
  compact = false,
}: AuditBadgeProps) {
  const { colors } = useTheme();

  if (version === undefined && !updatedAt && !createdAt) {
    return null;
  }

  const updatedDate = formatDate(updatedAt);
  const updatedUser = updatedByUsername || 'unknown';
  const createdDate = formatDate(createdAt);
  const createdUser = createdByUsername || 'unknown';

  const tooltip = `Created: ${createdDate} by ${createdUser}\nUpdated: ${updatedDate} by ${updatedUser}`;

  const fontSize = compact ? '0.65rem' : '0.7rem';
  const padding = compact ? '1px 5px' : '2px 7px';

  return (
    <span
      title={tooltip}
      className="inline-flex items-center gap-1 rounded-md font-mono select-none"
      style={{
        fontSize,
        padding,
        backgroundColor: colors.bgTertiary,
        color: colors.textMuted,
        border: `1px solid ${colors.borderSecondary}`,
      }}
    >
      <span style={{ color: colors.textSecondary }}>v{version ?? 1}</span>
      <span>·</span>
      <span>{updatedDate}</span>
      <span>by</span>
      <span style={{ color: colors.textSecondary }}>{updatedUser}</span>
    </span>
  );
}

function formatDate(input?: string): string {
  if (!input) return '—';
  // API returns either Y-m-d or full ISO; both should render as Y-m-d.
  const datePart = input.length >= 10 ? input.slice(0, 10) : input;
  return datePart;
}

interface AuditInfoBlockProps {
  /** Per-row monotonic version counter — bumped server-side when the row changes. */
  version?: number;
  createdAt?: string;
  createdByUsername?: string;
  updatedAt?: string;
  updatedByUsername?: string;
  /** Heading text shown above the metadata grid. */
  title?: string;
  /**
   * Short clarifier shown beneath the grid — explains that these values are
   * server-managed and round-trip via the SQL COMMENT JSON blob. Different
   * wording is appropriate for tables vs fields.
   */
  hint?: string;
}

/**
 * Larger read-only metadata card for use at the bottom of an edit panel.
 *
 * Pairs with the compact <AuditBadge>; renders the same data but with full
 * field labels and a hint so users understand they can't (and shouldn't)
 * edit these values directly. The values come back through the SQL COMMENT
 * round-trip — so an SQL export/import preserves audit history.
 */
export function AuditInfoBlock({
  version,
  createdAt,
  createdByUsername,
  updatedAt,
  updatedByUsername,
  title = 'Metadata',
  hint,
}: AuditInfoBlockProps) {
  const { colors } = useTheme();

  if (version === undefined && !createdAt && !updatedAt) {
    return null;
  }

  return (
    <div
      className="mt-4 rounded-lg p-3"
      style={{
        backgroundColor: colors.bgTertiary,
        border: `1px solid ${colors.borderSecondary}`,
      }}
    >
      <div
        className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1"
        style={{ color: colors.textMuted }}
      >
        <i className="pi pi-info-circle" style={{ fontSize: '0.7rem' }} />
        <span>{title}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm" style={{ color: colors.textSecondary }}>
        <div className="flex items-baseline gap-2">
          <span className="text-xs" style={{ color: colors.textMuted }}>Version</span>
          <span className="font-mono">v{version ?? 1}</span>
        </div>
        <div /> {/* spacer to keep the 2-col grid aligned */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs" style={{ color: colors.textMuted }}>Created</span>
          <span className="font-mono">{formatDate(createdAt)}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs" style={{ color: colors.textMuted }}>by</span>
          <span className="font-mono">{createdByUsername || 'unknown'}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs" style={{ color: colors.textMuted }}>Updated</span>
          <span className="font-mono">{formatDate(updatedAt)}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs" style={{ color: colors.textMuted }}>by</span>
          <span className="font-mono">{updatedByUsername || 'unknown'}</span>
        </div>
      </div>

      {hint && (
        <div className="text-xs mt-2 italic" style={{ color: colors.textMuted }}>
          {hint}
        </div>
      )}
    </div>
  );
}
