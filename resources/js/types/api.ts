/**
 * Standard envelope contract for the Scoriet CLI/API surface (/cli/v1/*).
 * Mirrors the Laravel-side `RespondsWithEnvelope` trait —
 * `app/Http/Controllers/Concerns/RespondsWithEnvelope.php`.
 *
 * Every response is one of two shapes, narrowable via the `success` discriminator:
 *
 *   if (res.success) {
 *     use(res.data);            // ApiSuccessResponse<T>
 *     res.meta?.pagination;     // optional, narrowed if present
 *   } else {
 *     showError(res.error.message);   // ApiErrorResponse
 *     if (res.error.code === ApiErrorCode.CONFLICT) { ... }
 *   }
 *
 * The Web `apiClient.cliRequest()` helper unwraps the envelope and returns
 * the inner `data` directly — these types are mainly useful for typing
 * raw responses (e.g. when calling fetch yourself) or for handling
 * meta/warnings/errors explicitly.
 */

/** Machine-readable error codes — kept in sync with the trait constants. */
export const ApiErrorCode = {
  VALIDATION_FAILED:    'VALIDATION_FAILED',
  NOT_FOUND:            'NOT_FOUND',
  UNAUTHORIZED:         'UNAUTHORIZED',
  FORBIDDEN:            'FORBIDDEN',
  CONFLICT:             'CONFLICT',
  UNKNOWN_FIELDS:       'UNKNOWN_FIELDS',
  RATE_LIMITED:         'RATE_LIMITED',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  SERVER_ERROR:         'SERVER_ERROR',
} as const;
export type ApiErrorCodeValue = typeof ApiErrorCode[keyof typeof ApiErrorCode];

/** Non-fatal hint attached to a successful response. */
export interface ApiWarning {
  code:    string;
  message: string;
  extra?:  unknown;
}

/** Optional structured info that explains an error. */
export interface ApiErrorDetails {
  /** Per-field validation messages keyed by field name. */
  [key: string]: unknown;
}

/** Optional meta block — pagination, updated_fields list, etc. */
export interface ApiMeta {
  pagination?: {
    page:        number;
    per_page:    number;
    total:       number;
    total_pages?: number;
  };
  /** Fields actually written by a partial update (echoed back so callers can verify). */
  updated_fields?: string[];
  /** Whatever else an endpoint wants to expose without polluting `data`. */
  [key: string]: unknown;
}

/** Successful response — `success: true` narrows to this shape. */
export interface ApiSuccessResponse<T = unknown> {
  success:   true;
  data:      T;
  meta?:     ApiMeta;
  warnings?: ApiWarning[];
}

/** Failed response — `success: false` narrows to this shape. */
export interface ApiErrorResponse {
  success: false;
  error: {
    code:     ApiErrorCodeValue | string; // backend may introduce new codes; keep open
    message:  string;
    details?: ApiErrorDetails | null;
  };
}

/** Union — discriminated by `success`. */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Thrown by `apiClient.cliRequest()` when the backend returns an error
 * envelope. Carries the structured `error` object plus the HTTP status,
 * so catch-handlers can branch on `error.code` without re-parsing.
 */
export class ApiEnvelopeError extends Error {
  public readonly code:    string;
  public readonly status:  number;
  public readonly details: ApiErrorDetails | null;

  constructor(error: ApiErrorResponse['error'], status: number) {
    super(error.message);
    this.name    = 'ApiEnvelopeError';
    this.code    = error.code;
    this.status  = status;
    this.details = error.details ?? null;
  }
}
