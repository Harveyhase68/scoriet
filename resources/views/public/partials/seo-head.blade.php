{{-- All search / social meta of a public page, driven by App\Support\Seo\SeoMeta ($seo). --}}
<title>{{ $seo->title }}</title>
<meta name="description" content="{{ $seo->description }}">
<meta name="robots" content="{{ $seo->robots() }}">
<link rel="canonical" href="{{ $seo->canonical }}">

@foreach ($seo->alternates as $hreflang => $href)
    <link rel="alternate" hreflang="{{ $hreflang }}" href="{{ $href }}">
@endforeach

{{-- Open Graph --}}
<meta property="og:type" content="{{ $seo->ogType }}">
<meta property="og:site_name" content="Scoriet">
<meta property="og:url" content="{{ $seo->canonical }}">
<meta property="og:title" content="{{ $seo->title }}">
<meta property="og:description" content="{{ $seo->description }}">
<meta property="og:image" content="{{ $seo->imageUrl() }}">
<meta property="og:locale" content="{{ \App\Support\Seo\PublicLocales::ogLocale($seo->locale) }}">
@foreach (array_keys($seo->alternates) as $hreflang)
    @if ($hreflang !== 'x-default' && $hreflang !== $seo->locale)
        <meta property="og:locale:alternate" content="{{ \App\Support\Seo\PublicLocales::ogLocale($hreflang) }}">
    @endif
@endforeach

{{-- Twitter / X --}}
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="{{ $seo->title }}">
<meta name="twitter:description" content="{{ $seo->description }}">
<meta name="twitter:image" content="{{ $seo->imageUrl() }}">

{{-- Structured data (schema.org). JSON_HEX_TAG turns "<" and ">" into < / >, so no value can close the script tag. --}}
@foreach ($seo->jsonLd as $node)
    <script type="application/ld+json">{!! json_encode($node, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) !!}</script>
@endforeach
