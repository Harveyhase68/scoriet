<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Helper for PUT endpoints that accept a partial update.
 *
 * Laravel's validator silently passes when the body contains ONLY unknown
 * fields ($validated stays empty, $project->update([]) is a no-op, response
 * looks successful). For internal-only APIs that's fine — for a public API
 * consumed via Postman / external tooling it's a foot-gun: callers see
 * "success: true" and assume their payload was applied.
 *
 * This trait gives controllers two consistent escape hatches:
 *
 *   1. checkBodyFields($request, $expectedFields)
 *        Returns ['received', 'unknown', 'all_unknown']. Call it BEFORE the
 *        validator runs so you can short-circuit on the "all unknown" case
 *        with a clear 422 — and so you can attach an `unknown_fields`
 *        warning to a successful partial update.
 *
 *   2. unknownFieldsResponse($expected, $received)
 *        Pre-baked 422 JsonResponse for the all-unknown case. Keeps the
 *        wire format consistent across every endpoint that adopts the trait.
 *
 *   3. unknownFieldsWarning($unknownFields)
 *        Pre-baked warning block to merge into a 200 response when SOME
 *        fields were unknown. Returns null when there's nothing to warn.
 *
 * Adoption: `use ValidatesPartialUpdate;` in the controller, then call the
 * helpers around your existing Validator::make(...) / $request->validate(...)
 * — no other change needed.
 */
trait ValidatesPartialUpdate
{
    /**
     * Classify the request body keys against an expected-fields whitelist.
     *
     * @param  Request  $request
     * @param  string[] $expectedFields  All keys this endpoint understands.
     * @return array{received: string[], unknown: string[], all_unknown: bool}
     */
    protected function checkBodyFields(Request $request, array $expectedFields): array
    {
        $received = array_keys($request->all());
        $unknown  = array_values(array_diff($received, $expectedFields));
        $allUnknown = !empty($received) && empty(array_intersect($received, $expectedFields));

        return [
            'received'    => $received,
            'unknown'     => $unknown,
            'all_unknown' => $allUnknown,
        ];
    }

    /**
     * Standard 422 response for "body present but no key matched the schema".
     * Includes both lists so the caller can diff client-side and fix the payload.
     *
     * @param  string[] $expectedFields
     * @param  string[] $receivedFields
     * @return JsonResponse
     */
    protected function unknownFieldsResponse(array $expectedFields, array $receivedFields): JsonResponse
    {
        return response()->json([
            'success'         => false,
            'message'         => 'No recognised fields in the request body.',
            'expected_fields' => $expectedFields,
            'received_fields' => $receivedFields,
        ], 422);
    }

    /**
     * Warning block to merge into a successful response when SOME fields were
     * ignored. Returns null when there's nothing to warn about (so callers can
     * conditionally attach it without branching).
     *
     * @param  string[] $unknownFields
     * @return array{unknown_fields: string[], message: string}|null
     */
    protected function unknownFieldsWarning(array $unknownFields): ?array
    {
        if (empty($unknownFields)) {
            return null;
        }
        return [
            'unknown_fields' => $unknownFields,
            'message'        => 'Some fields in the request body were not recognised and have been ignored.',
        ];
    }
}
