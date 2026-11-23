@extends('public.layout')

@php
    $formatDate = function ($value) use ($locale) {
        if (empty($value)) {
            return '—';
        }
        return \Illuminate\Support\Carbon::parse($value)->locale($locale)->isoFormat('LL');
    };

    $languageName = fn (string $code) => \App\Support\Seo\PublicLocales::SUPPORTED[$code] ?? strtoupper($code);

    $attachmentIcon = function (?string $mime): string {
        $mime = (string) $mime;
        if (str_starts_with($mime, 'image/')) {
            return 'pi-image text-blue-400';
        }
        if ($mime === 'application/pdf') {
            return 'pi-file-pdf text-red-400';
        }
        if (str_contains($mime, 'word')) {
            return 'pi-file-word text-blue-400';
        }
        if (str_contains($mime, 'excel') || str_contains($mime, 'spreadsheet')) {
            return 'pi-file-excel text-green-400';
        }
        return 'pi-file text-(--theme-text-muted)';
    };

    $stats = [
        ['icon' => 'pi-users', 'color' => 'text-blue-500', 'count' => $project['stats']['teams_count'], 'label' => __('landing.project_teams')],
        ['icon' => 'pi-file-edit', 'color' => 'text-green-500', 'count' => $project['stats']['templates_count'], 'label' => __('landing.project_templates')],
        ['icon' => 'pi-database', 'color' => 'text-purple-500', 'count' => $project['stats']['schemas_count'], 'label' => __('landing.project_databases')],
    ];
@endphp

@section('content')
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {{-- Project header --}}
        <div class="mb-8 flex flex-col sm:flex-row items-start gap-6">
            <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                <i class="pi pi-folder text-white pub-icon--xl" aria-hidden="true"></i>
            </div>
            <div class="flex-1">
                <h1 class="text-3xl font-bold mb-2 text-(--theme-text-primary)">{{ $displayName }}</h1>
                <p class="mb-3 text-(--theme-text-muted)">
                    {{ __('landing.project_by') }} <span class="font-medium text-(--theme-accent)">{{ '@' . $project['owner']['username'] }}</span>
                </p>
                @if (!empty($project['description']))
                    <p class="text-lg text-(--theme-text-secondary)">{{ $project['description'] }}</p>
                @endif
            </div>
        </div>

        {{-- Statistics --}}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            @foreach ($stats as $stat)
                <div class="pub-card p-5 flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-(--theme-bg-tertiary)">
                        <i class="pi {{ $stat['icon'] }} {{ $stat['color'] }} pub-icon--md" aria-hidden="true"></i>
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-(--theme-text-primary)">{{ $stat['count'] }}</p>
                        <p class="text-(--theme-text-muted)">{{ $stat['label'] }}</p>
                    </div>
                </div>
            @endforeach
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="space-y-6">
                {{-- Settings --}}
                <section class="pub-card p-5">
                    <h2 class="flex items-center gap-2 text-lg font-semibold mb-4 text-(--theme-text-primary)">
                        <i class="pi pi-globe" aria-hidden="true"></i>{{ __('landing.project_settings') }}
                    </h2>
                    @if (!empty($project['enabled_languages']))
                        <p class="text-sm mb-2 text-(--theme-text-muted)">{{ __('landing.project_languages') }}</p>
                        <div class="flex flex-wrap gap-2">
                            @foreach ($project['enabled_languages'] as $lang)
                                <span class="rounded px-2 py-1 text-xs font-semibold {{ $lang === $project['default_language'] ? 'bg-(--theme-accent) text-white' : 'bg-(--theme-bg-tertiary) text-(--theme-text-secondary)' }}">{{ $languageName($lang) }}</span>
                            @endforeach
                        </div>
                    @endif
                    @if (!empty($project['project_url']))
                        <hr class="my-4 border-(--theme-border-secondary)">
                        <p class="flex items-center gap-2">
                            <i class="pi pi-link text-(--theme-text-muted)" aria-hidden="true"></i>
                            <a href="{{ $project['project_url'] }}" target="_blank" rel="noopener noreferrer nofollow" class="underline text-(--theme-accent) break-all">{{ $project['project_url'] }}</a>
                        </p>
                    @endif
                </section>

                {{-- Teams --}}
                @if (count($project['teams']) > 0)
                    <section class="pub-card p-5">
                        <h2 class="flex items-center gap-2 text-lg font-semibold mb-4 text-(--theme-text-primary)">
                            <i class="pi pi-users" aria-hidden="true"></i>{{ __('landing.project_teams') }}
                            <span class="rounded-full px-2 text-xs bg-(--theme-accent) text-white">{{ count($project['teams']) }}</span>
                        </h2>
                        <div class="space-y-3">
                            @foreach ($project['teams'] as $team)
                                <div class="p-3 rounded-lg bg-(--theme-bg-tertiary)">
                                    <h3 class="font-medium text-(--theme-text-primary)">{{ $team->name }}</h3>
                                    @if ($team->description)
                                        <p class="text-sm mt-1 text-(--theme-text-muted)">{{ $team->description }}</p>
                                    @endif
                                </div>
                            @endforeach
                        </div>
                    </section>
                @endif
            </div>

            <div class="space-y-6">
                {{-- Templates --}}
                @if (count($project['templates']) > 0)
                    <section class="pub-card p-5">
                        <h2 class="flex items-center gap-2 text-lg font-semibold mb-4 text-(--theme-text-primary)">
                            <i class="pi pi-file-edit" aria-hidden="true"></i>{{ __('landing.project_templates') }}
                            <span class="rounded-full px-2 text-xs bg-green-600 text-white">{{ count($project['templates']) }}</span>
                        </h2>
                        <div class="space-y-3">
                            @foreach ($project['templates'] as $template)
                                <div class="p-3 rounded-lg bg-(--theme-bg-tertiary)">
                                    <h3 class="font-medium flex items-center gap-2 text-(--theme-text-primary)">
                                        {{ $template->name }}
                                        @if ($template->is_system_template)
                                            <span class="rounded px-2 text-xs bg-amber-500 text-gray-900">{{ __('landing.project_system_template') }}</span>
                                        @endif
                                    </h3>
                                    @if ($template->description)
                                        <p class="text-sm mt-1 text-(--theme-text-muted)">{{ $template->description }}</p>
                                    @endif
                                </div>
                            @endforeach
                        </div>
                    </section>
                @endif

                {{-- Databases / schemas --}}
                @if (count($project['schemas']) > 0)
                    <section class="pub-card p-5">
                        <h2 class="flex items-center gap-2 text-lg font-semibold mb-4 text-(--theme-text-primary)">
                            <i class="pi pi-database" aria-hidden="true"></i>{{ __('landing.project_databases') }}
                            <span class="rounded-full px-2 text-xs bg-(--theme-bg-tertiary) text-(--theme-text-secondary)">{{ count($project['schemas']) }}</span>
                        </h2>
                        <div class="space-y-3">
                            @foreach ($project['schemas'] as $schema)
                                <div class="p-3 rounded-lg bg-(--theme-bg-tertiary)">
                                    <h3 class="font-medium text-(--theme-text-primary)">{{ $schema->name }}</h3>
                                    @if ($schema->description)
                                        <p class="text-sm mt-1 text-(--theme-text-muted)">{{ $schema->description }}</p>
                                    @endif
                                </div>
                            @endforeach
                        </div>
                    </section>
                @endif

                {{-- Attachments (metadata only, no download) --}}
                @if (count($project['attachments']) > 0)
                    <section class="pub-card p-5">
                        <h2 class="flex items-center gap-2 text-lg font-semibold mb-4 text-(--theme-text-primary)">
                            <i class="pi pi-paperclip" aria-hidden="true"></i>{{ __('landing.project_attachments') }}
                            <span class="rounded-full px-2 text-xs bg-amber-500 text-gray-900">{{ count($project['attachments']) }}</span>
                        </h2>
                        <div class="space-y-3">
                            @foreach ($project['attachments'] as $attachment)
                                <div class="p-3 rounded-lg bg-(--theme-bg-tertiary) flex items-center gap-3">
                                    <i class="pi {{ $attachmentIcon($attachment['mime_type']) }} pub-icon--md" aria-hidden="true"></i>
                                    <div class="flex-1 min-w-0">
                                        <p class="font-medium flex items-center gap-2 text-(--theme-text-primary) break-all">
                                            {{ $attachment['original_filename'] }}
                                            @if ($attachment['is_pinned'])
                                                <i class="pi pi-bookmark-fill text-yellow-400 text-sm" aria-hidden="true"></i>
                                            @endif
                                        </p>
                                        <p class="text-sm text-(--theme-text-muted)">{{ $attachment['category_label'] }} • {{ $attachment['formatted_size'] }}</p>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </section>
                @endif

                {{-- Dates --}}
                <section class="pub-card p-5 text-sm space-y-3">
                    <p class="flex justify-between">
                        <span class="text-(--theme-text-muted)">{{ __('landing.project_created') }}:</span>
                        <time datetime="{{ optional($project['created_at'])->toAtomString() }}" class="text-(--theme-text-primary)">{{ $formatDate($project['created_at']) }}</time>
                    </p>
                    <p class="flex justify-between">
                        <span class="text-(--theme-text-muted)">{{ __('landing.project_updated') }}:</span>
                        <time datetime="{{ optional($project['updated_at'])->toAtomString() }}" class="text-(--theme-text-primary)">{{ $formatDate($project['updated_at']) }}</time>
                    </p>
                </section>
            </div>
        </div>

        <p class="mt-12 text-sm text-center text-(--theme-text-muted)">
            {{ __('landing.project_powered_by') }} <a href="{{ \App\Support\Seo\PublicLocales::homeUrl($locale) }}" class="text-(--theme-accent)">Scoriet</a> – {{ __('landing.project_tagline') }}
        </p>
    </div>
@endsection
