@extends('public.layout')

@section('content')
    <section class="py-20 bg-(--theme-bg-primary)">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {{-- Revealed by the island for system users only. --}}
            <div class="flex justify-end mb-4">
                <a href="/app?panel=cms&amp;pageId={{ $page->id }}" class="pub-btn pub-btn--warning" data-system-only hidden>
                    <i class="pi pi-pencil" aria-hidden="true"></i>{{ __('landing.edit_page') }}
                </a>
            </div>

            <h1 class="text-4xl font-bold text-center mb-8 text-(--theme-accent)">{{ $page->title }}</h1>

            <article class="pub-card shadow-lg p-8">
                {{-- CMS HTML is authored by system administrators only (admin CMS panel). --}}
                <div class="cms-content">{!! $page->content !!}</div>
            </article>
        </div>
    </section>
@endsection
