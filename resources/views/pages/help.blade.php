@extends('layouts.static')

@section('title', __('pages.help.title') ?? 'Help')

@section('content')
<div style="max-width: 56rem; margin: 0 auto;">
    <h1 style="font-size: 2.25rem; font-weight: 700; color: white; margin-bottom: 2rem; text-align: center;">
        {{ __('pages.help.title') ?? 'Help Center' }}
    </h1>

    <div style="background-color: #1f2937; border-radius: 0.5rem; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); padding: 2rem;">
        <div style="color: #e5e7eb; line-height: 1.75;">
            <p style="margin-bottom: 1.5rem;">{{ __('pages.help.content') ?? 'Welcome to the Scoriet Help Center' }}</p>

            <h2 style="font-size: 1.5rem; font-weight: 600; color: white; margin-top: 1.5rem; margin-bottom: 1rem;">
                {{ __('pages.help.getting_started') ?? 'Getting Started' }}
            </h2>
            <p style="margin-bottom: 1rem;">{{ __('pages.help.getting_started_desc') ?? 'Learn how to get started with Scoriet' }}</p>

            <h3 style="font-size: 1.25rem; font-weight: 600; color: #60a5fa; margin-top: 1.25rem; margin-bottom: 0.75rem;">
                {{ __('pages.help.create_project') ?? 'Create Your First Project' }}
            </h3>
            <ol style="margin-left: 1.5rem; margin-bottom: 1.5rem; list-style: decimal;">
                <li style="margin-bottom: 0.5rem;">{{ __('pages.help.step1') ?? 'Step 1' }}</li>
                <li style="margin-bottom: 0.5rem;">{{ __('pages.help.step2') ?? 'Step 2' }}</li>
                <li style="margin-bottom: 0.5rem;">{{ __('pages.help.step3') ?? 'Step 3' }}</li>
                <li style="margin-bottom: 0.5rem;">{{ __('pages.help.step4') ?? 'Step 4' }}</li>
            </ol>

            <h2 style="font-size: 1.5rem; font-weight: 600; color: white; margin-top: 1.5rem; margin-bottom: 1rem;">
                {{ __('pages.help.features') ?? 'Features' }}
            </h2>
            <ul style="margin-left: 1.5rem; margin-bottom: 1.5rem; list-style: disc;">
                <li style="margin-bottom: 0.5rem;">{{ __('pages.help.feature1') ?? 'Feature 1' }}</li>
                <li style="margin-bottom: 0.5rem;">{{ __('pages.help.feature2') ?? 'Feature 2' }}</li>
                <li style="margin-bottom: 0.5rem;">{{ __('pages.help.feature3') ?? 'Feature 3' }}</li>
                <li style="margin-bottom: 0.5rem;">{{ __('pages.help.feature4') ?? 'Feature 4' }}</li>
            </ul>

            <h2 style="font-size: 1.5rem; font-weight: 600; color: white; margin-top: 1.5rem; margin-bottom: 1rem;">
                {{ __('pages.help.support') ?? 'Support' }}
            </h2>
            <p style="margin-bottom: 1rem;">{{ __('pages.help.support_desc') ?? 'Contact our support team' }}</p>
        </div>
    </div>
</div>
@endsection