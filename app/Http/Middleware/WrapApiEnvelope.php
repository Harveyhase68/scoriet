<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Wraps every /cli/v1/* JSON response in the standard envelope shape:
 *
 *   success: { success: true,  data: <T>, meta?: {...}, warnings?: [...] }
 *   error:   { success: false, error: { code, message, details? } }
 *
 * Why a middleware instead of refactoring 174 inline `response()->json(...)`
 * call sites: this gets the new contract live in one file, with zero risk
 * of missing an edge case scattered across 6 controllers. New endpoints
 * can use the `RespondsWithEnvelope` trait directly — those responses are
 * already in canonical shape and the middleware leaves them alone.
 *
 * Detection: a response is considered "already enveloped" if it has BOTH
 * `success` and one of (`data`, `error`) at the top level. Everything else
 * gets wrapped according to the HTTP status code:
 *
 *   2xx → success, payload moves into `data`. Known meta keys are pulled
 *         out of the payload and placed under `meta` (so they're
 *         discoverable in a stable place). Warnings get the same treatment.
 *   4xx/5xx → error, message/code/details extracted from the original body.
 *
 * Non-JSON responses (file downloads, streams, redirects) are returned
 * untouched.
 */
class WrapApiEnvelope
{
    /**
     * Keys that the legacy controllers use for "non-payload" information.
     * If present at the top of a 2xx response, they're hoisted into `meta`
     * instead of buried in `data`. Anything else stays in `data`.
     */
    private const META_KEYS = [
        'updated_fields',
        'pagination',
        'total',           // legacy list endpoints used this at top level
        'count',
        'page',
        'per_page',
    ];

    /** Status-code → error code mapping for legacy responses that don't carry one. */
    private const STATUS_TO_ERROR_CODE = [
        400 => 'BAD_REQUEST',
        401 => 'UNAUTHORIZED',
        402 => 'PAYMENT_REQUIRED',
        403 => 'FORBIDDEN',
        404 => 'NOT_FOUND',
        409 => 'CONFLICT',
        422 => 'VALIDATION_FAILED',
        429 => 'RATE_LIMITED',
        500 => 'SERVER_ERROR',
        503 => 'SERVICE_UNAVAILABLE',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only wrap actual JSON responses — leave file streams,
        // redirects, plain views, etc. untouched.
        if (! $response instanceof JsonResponse) {
            return $response;
        }

        $body = $response->getData(true);
        if (! is_array($body)) {
            // The endpoint returned a raw scalar/array (e.g. a list).
            // Treat it as the payload for whatever the HTTP status says.
            return $this->wrap($response, $body);
        }

        // Skip if already enveloped — Trait-aware endpoints land here.
        if (
            array_key_exists('success', $body)
            && (array_key_exists('data', $body) || array_key_exists('error', $body))
        ) {
            return $response;
        }

        return $this->wrap($response, $body);
    }

    /**
     * Build the envelope and replace the response body.
     *
     * @param  JsonResponse        $response
     * @param  array|mixed         $body  original body — array of legacy keys, or a raw value
     */
    private function wrap(JsonResponse $response, mixed $body): JsonResponse
    {
        $status = $response->getStatusCode();
        $isSuccess = $status >= 200 && $status < 300;

        if ($isSuccess) {
            $envelope = $this->buildSuccessEnvelope(is_array($body) ? $body : ['value' => $body]);
        } else {
            $envelope = $this->buildErrorEnvelope(is_array($body) ? $body : ['message' => (string) $body], $status);
        }

        $response->setData($envelope);
        return $response;
    }

    /**
     * Hoist known meta/warnings keys out of the payload; whatever's left
     * becomes `data`. If the only payload was `{success: true}` (no other
     * keys) we expose `data: null` rather than `data: {}` so callers don't
     * have to distinguish empty-object from null-payload.
     */
    private function buildSuccessEnvelope(array $body): array
    {
        // Drop the legacy success flag if present — we always set it ourselves.
        unset($body['success']);

        $meta = [];
        foreach (self::META_KEYS as $metaKey) {
            if (array_key_exists($metaKey, $body)) {
                $meta[$metaKey] = $body[$metaKey];
                unset($body[$metaKey]);
            }
        }

        $warnings = null;
        if (array_key_exists('warnings', $body)) {
            $warnings = is_array($body['warnings']) ? array_values($body['warnings']) : null;
            unset($body['warnings']);
        }

        // Legacy "message" on success → keep alongside the payload under meta
        // so it's discoverable, but don't promote it into `data`. Most callers
        // ignore success messages anyway; the few that care can read meta.message.
        if (array_key_exists('message', $body)) {
            $meta['message'] = $body['message'];
            unset($body['message']);
        }

        // Whatever remains is the payload. Empty → null for cleaner API.
        $data = empty($body) ? null : $body;

        $envelope = ['success' => true, 'data' => $data];
        if (!empty($meta))     $envelope['meta']     = $meta;
        if (!empty($warnings)) $envelope['warnings'] = $warnings;
        return $envelope;
    }

    /**
     * Build an error envelope. Tries hard to pull meaningful values out of
     * the wide variety of legacy error shapes:
     *   {success: false, message: '...'}
     *   {success: false, error: '...', errors: {...}}
     *   {message: '...'}                       // bare 401 etc.
     *   {error_code: '...', message: '...'}    // CodeAdjustments style
     */
    private function buildErrorEnvelope(array $body, int $status): array
    {
        // Code resolution priority: explicit error_code from the controller,
        // then status-code mapping, then a generic fallback.
        $code = $body['error_code']
            ?? self::STATUS_TO_ERROR_CODE[$status]
            ?? 'ERROR';

        // Message resolution: 'message' wins (most common), then a string
        // 'error', then a default.
        $message = null;
        if (isset($body['message']) && is_string($body['message'])) {
            $message = $body['message'];
        } elseif (isset($body['error']) && is_string($body['error'])) {
            $message = $body['error'];
        } else {
            $message = 'Request failed.';
        }

        // Details: validation errors live under 'errors'. Everything else
        // that's not message/error/success/error_code gets bundled into
        // details so the caller doesn't lose information.
        $details = null;
        if (isset($body['errors'])) {
            $details = $body['errors'];
        } else {
            $remaining = $body;
            unset($remaining['message'], $remaining['error'], $remaining['success'], $remaining['error_code'], $remaining['errors']);
            if (!empty($remaining)) {
                $details = $remaining;
            }
        }

        $error = ['code' => (string) $code, 'message' => $message];
        if ($details !== null) $error['details'] = $details;

        return ['success' => false, 'error' => $error];
    }
}
