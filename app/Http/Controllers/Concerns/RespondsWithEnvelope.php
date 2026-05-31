<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

/**
 * Standard envelope contract for the public CLI/API surface.
 *
 * Every endpoint that adopts this trait returns one of two shapes:
 *
 *   SUCCESS — 2xx
 *   {
 *     "success": true,
 *     "data":    <T>,                    // the actual payload (object, array, primitive, or null)
 *     "meta":    { ... } | null,         // optional non-payload info (pagination, updated_fields, etc.)
 *     "warnings":[ { code, message } ]   // optional non-fatal hints
 *   }
 *
 *   ERROR — 4xx / 5xx
 *   {
 *     "success": false,
 *     "error": {
 *       "code":    "SCREAMING_SNAKE",    // machine-readable identifier
 *       "message": "Human-readable",     // safe to display to end-user
 *       "details": { ... } | null        // optional structured info (field errors, candidate ids, etc.)
 *     }
 *   }
 *
 * Why this trait instead of inline arrays at every return: 50+ endpoints
 * used to invent their own shape ({template:…}, {schemas:…}, {settings:…},
 * {success,message,errors:{…}}, …). External callers had to special-case
 * each one. With one wrapper, every consumer can write:
 *
 *   if (res.success) use(res.data) else show(res.error.message)
 *
 * Adoption: `use RespondsWithEnvelope;` then call `$this->ok(...)` /
 * `$this->fail(...)` / one of the typed helpers below.
 */
trait RespondsWithEnvelope
{
    /**
     * Standard error codes — keep them short, SCREAMING_SNAKE, stable.
     * Callers may match on these to drive UX (e.g. show a renewal prompt
     * on INSUFFICIENT_CREDITS). New codes go here as we need them.
     */
    public const ERR_VALIDATION_FAILED   = 'VALIDATION_FAILED';
    public const ERR_NOT_FOUND           = 'NOT_FOUND';
    public const ERR_UNAUTHORIZED        = 'UNAUTHORIZED';      // not authenticated
    public const ERR_FORBIDDEN           = 'FORBIDDEN';         // authenticated but not allowed
    public const ERR_CONFLICT            = 'CONFLICT';          // resource state collision (e.g. duplicate name)
    public const ERR_UNKNOWN_FIELDS      = 'UNKNOWN_FIELDS';    // PUT body had only unrecognized keys
    public const ERR_RATE_LIMITED        = 'RATE_LIMITED';
    public const ERR_INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS';
    public const ERR_SERVER_ERROR        = 'SERVER_ERROR';

    /**
     * Generic success response.
     *
     * @param  mixed                $data     payload — anything JSON-serializable
     * @param  array|null           $meta     non-payload info (pagination, updated_fields, etc.)
     * @param  array<int,array>|null $warnings list of {code, message} hints
     * @param  int                  $status   HTTP status (default 200)
     */
    protected function ok(mixed $data = null, ?array $meta = null, ?array $warnings = null, int $status = 200): JsonResponse
    {
        $body = ['success' => true, 'data' => $data];
        if ($meta !== null && $meta !== [])      $body['meta']     = $meta;
        if ($warnings !== null && $warnings !== []) $body['warnings'] = array_values($warnings);
        return response()->json($body, $status);
    }

    /** Convenience for created resources (201). */
    protected function created(mixed $data, ?array $meta = null): JsonResponse
    {
        return $this->ok($data, $meta, null, 201);
    }

    /** Generic error response. */
    protected function fail(string $code, string $message, mixed $details = null, int $status = 400): JsonResponse
    {
        $error = ['code' => $code, 'message' => $message];
        if ($details !== null) $error['details'] = $details;
        return response()->json(['success' => false, 'error' => $error], $status);
    }

    /** 422 — validation errors. Pass either ValidationException or a raw [field => [messages]] map. */
    protected function failValidation(ValidationException|array $source, ?string $message = null): JsonResponse
    {
        $errors = $source instanceof ValidationException ? $source->errors() : $source;
        return $this->fail(
            self::ERR_VALIDATION_FAILED,
            $message ?? 'Validation failed.',
            $errors,
            422
        );
    }

    /** 404. */
    protected function failNotFound(string $message = 'Resource not found.', mixed $details = null): JsonResponse
    {
        return $this->fail(self::ERR_NOT_FOUND, $message, $details, 404);
    }

    /** 401 — caller has no/invalid token. */
    protected function failUnauthorized(string $message = 'Authentication required.'): JsonResponse
    {
        return $this->fail(self::ERR_UNAUTHORIZED, $message, null, 401);
    }

    /** 403 — caller is authenticated but lacks permission. */
    protected function failForbidden(string $message = 'You do not have permission for this action.', mixed $details = null): JsonResponse
    {
        return $this->fail(self::ERR_FORBIDDEN, $message, $details, 403);
    }

    /** 409 — state collision (duplicate name etc.). */
    protected function failConflict(string $message, mixed $details = null): JsonResponse
    {
        return $this->fail(self::ERR_CONFLICT, $message, $details, 409);
    }

    /** 500 — unexpected server-side failure. */
    protected function failServer(string $message = 'An unexpected server error occurred.', ?\Throwable $e = null): JsonResponse
    {
        // Only surface raw exception messages in debug — production should
        // never leak internals through `details`. APP_DEBUG=true → details
        // contains the exception class + message for diagnostics.
        $details = ($e !== null && config('app.debug'))
            ? ['exception' => get_class($e), 'message' => $e->getMessage()]
            : null;
        return $this->fail(self::ERR_SERVER_ERROR, $message, $details, 500);
    }

    /**
     * Build a standard warning entry (use inside warnings[] arrays).
     * Optional helper — the warning shape is just {code, message, ...extra}.
     */
    protected function warning(string $code, string $message, mixed $extra = null): array
    {
        $w = ['code' => $code, 'message' => $message];
        if ($extra !== null) $w['extra'] = $extra;
        return $w;
    }
}
