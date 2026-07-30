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
            ->get();

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ca_i' => 'required|integer',
            'ca_no' => 'required|integer',
            'cust_no' => 'required|integer',
            'addr_no' => 'required|integer',
            'ca_addr_type' => 'required|string',
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
            'ca_i' => 'required|integer',
            'ca_no' => 'required|integer',
            'cust_no' => 'required|integer',
            'addr_no' => 'required|integer',
            'ca_addr_type' => 'required|string',
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
