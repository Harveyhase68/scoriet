@extends('layouts.static')

@section('title', $page->title)

@section('content')
<div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-blue-400 mb-6">{{ $page->title }}</h1>

    <div class="bg-gray-800 dark:bg-gray-900 rounded-lg shadow-lg p-8">
        <div class="prose prose-lg prose-gray dark:prose-invert max-w-none text-gray-300">
            {!! $page->content !!}
        </div>
    </div>
</div>
@endsection