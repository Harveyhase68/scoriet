<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::with('prodGroup')
            ->ordered()
            ->get()
            ->map(function ($product) {
                $product->has_image = !empty($product->getRawOriginal('prod_image'));
                return $product;
            });

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pc_id' => 'required|integer',
            'count_iso2' => 'required|string|max:2',
            'pc_postal_code' => 'required|string|max:32',
            'pc_city' => 'required|string|max:128',
            'pc_state' => 'nullable|string|max:128',
            'pc_subdivision' => 'nullable|string|max:128',
            'pc_latitude' => 'nullable|numeric',
            'pc_longitude' => 'nullable|numeric',
            'pc_timezone' => 'nullable|string|max:64',
            'pc_population' => 'nullable|integer',
            'pc_delivery_zone' => 'nullable|string|max:64',
            'pc_postal_format' => 'nullable|string|max:255',
            'pc_is_active' => 'nullable|integer',
            'pc_valid_from' => 'nullable|date',
            'pc_valid_to' => 'nullable|date',
            'pc_notes' => 'nullable|string',
            'pc_created_at' => 'nullable|datetime',
            'pc_updated_at' => 'nullable|datetime',
        ]);

        $validated['prod_special_offer'] = filter_var($validated['prod_special_offer'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;

        if ($request->hasFile('prod_image')) {
            $validated['prod_image'] = $request->file('prod_image')->getContent();
        } else {
            $validated['prod_image'] = '';
        }

        $product = Product::create($validated);
        $product->load('prodGroup');
        $product->has_image = !empty($product->getRawOriginal('prod_image'));

        return response()->json($product, 201);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load('prodGroup');
        $product->has_image = !empty($product->getRawOriginal('prod_image'));
        return response()->json($product);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'pc_id' => 'required|integer',
            'count_iso2' => 'required|string|max:2',
            'pc_postal_code' => 'required|string|max:32',
            'pc_city' => 'required|string|max:128',
            'pc_state' => 'nullable|string|max:128',
            'pc_subdivision' => 'nullable|string|max:128',
            'pc_latitude' => 'nullable|numeric',
            'pc_longitude' => 'nullable|numeric',
            'pc_timezone' => 'nullable|string|max:64',
            'pc_population' => 'nullable|integer',
            'pc_delivery_zone' => 'nullable|string|max:64',
            'pc_postal_format' => 'nullable|string|max:255',
            'pc_is_active' => 'nullable|integer',
            'pc_valid_from' => 'nullable|date',
            'pc_valid_to' => 'nullable|date',
            'pc_notes' => 'nullable|string',
            'pc_created_at' => 'nullable|datetime',
            'pc_updated_at' => 'nullable|datetime',
        ]);

        $validated['prod_special_offer'] = filter_var($validated['prod_special_offer'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;

        if ($request->hasFile('prod_image')) {
            $validated['prod_image'] = $request->file('prod_image')->getContent();
        } else {
            unset($validated['prod_image']);
        }

        // Allow removing image
        if ($request->boolean('remove_image')) {
            $validated['prod_image'] = '';
        }

        $product->update($validated);
        $product->load('prodGroup');
        $product->has_image = !empty($product->getRawOriginal('prod_image'));

        return response()->json($product);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();
        return response()->json(['message' => 'Product deleted successfully.']);
    }

    public function image(Product $product): Response
    {
        $imageData = $product->getRawOriginal('prod_image');

        if (empty($imageData)) {
            abort(404);
        }

        // Detect MIME type from binary data
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->buffer($imageData) ?: 'image/jpeg';

        return response($imageData, 200)
            ->header('Content-Type', $mimeType)
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}
