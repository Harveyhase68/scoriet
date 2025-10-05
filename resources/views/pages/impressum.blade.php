@extends('layouts.static')

@section('title', 'Impressum')

@section('content')
<div style="max-width: 56rem; margin: 0 auto;">
    <h1 style="font-size: 2.25rem; font-weight: 700; color: white; margin-bottom: 2rem; text-align: center;">
        {{ __('pages.impressum.title') ?? 'Impressum' }}
    </h1>

    <div style="background-color: #1f2937; border-radius: 0.5rem; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); padding: 2rem;">
        <div style="color: #e5e7eb; line-height: 1.75;">
            <h2 style="font-size: 1.5rem; font-weight: 600; color: white; margin-top: 1.5rem; margin-bottom: 1rem;">
                {{ __('pages.impressum.content') ?? 'Angaben gemäß § 5 TMG' }}
            </h2>
            <p style="margin-bottom: 1rem;">
                {{ __('pages.impressum.company') ?? 'Firmenname' }}<br>
                {{ __('pages.impressum.address') ?? 'Adresse' }}
            </p>

            <h2 style="font-size: 1.5rem; font-weight: 600; color: white; margin-top: 1.5rem; margin-bottom: 1rem;">Kontakt</h2>
            <p style="margin-bottom: 1rem;">{{ __('pages.impressum.contact') ?? 'Kontaktinformationen' }}</p>

            <h2 style="font-size: 1.5rem; font-weight: 600; color: white; margin-top: 1.5rem; margin-bottom: 1rem;">Vertreten durch</h2>
            <p style="margin-bottom: 1rem;">{{ __('pages.impressum.representative') ?? 'Geschäftsführer' }}</p>

            <h2 style="font-size: 1.5rem; font-weight: 600; color: white; margin-top: 1.5rem; margin-bottom: 1rem;">Registereintrag</h2>
            <p style="margin-bottom: 1rem;">{{ __('pages.impressum.registry') ?? 'Handelsregister' }}</p>

            <h2 style="font-size: 1.5rem; font-weight: 600; color: white; margin-top: 1.5rem; margin-bottom: 1rem;">Umsatzsteuer-ID</h2>
            <p style="margin-bottom: 1rem;">{{ __('pages.impressum.vat') ?? 'USt-IdNr.' }}</p>
        </div>
    </div>
</div>
@endsection