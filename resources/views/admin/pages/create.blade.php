@extends('layouts.static')

@section('content')
<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="md:grid md:grid-cols-3 md:gap-6">
        <div class="md:col-span-1">
            <div class="px-4 sm:px-0">
                <h3 class="text-lg font-medium leading-6 text-white">{{__('createbladephp8')}}</h3>
                <p class="mt-1 text-sm text-gray-300">
                    {{__('createbladephp10')}}
                </p>
            </div>
        </div>
        <div class="mt-5 md:col-span-2 md:mt-0">
            <form action="{{ route('admin.pages.store') }}" method="POST">
                @csrf

                <div class="shadow-lg sm:overflow-hidden sm:rounded-md">
                    <div class="space-y-6 bg-gray-800 px-4 py-5 sm:p-6">
                        <div>
                            <label for="slug" class="block text-sm font-medium text-gray-300">{{__('createbladephp21')}}</label>
                            <input type="text" name="slug" id="slug" value="{{ old('slug') }}"
                                   class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                   placeholder="e.g., about-us, contact" required>
                            @error('slug')
                                <p class="mt-1 text-sm text-red-400">{{ $message }}</p>
                            @enderror
                            <p class="mt-1 text-sm text-gray-400">{{__('createbladephp28')}}</p>
                        </div>

                        <div>
                            <label for="locale" class="block text-sm font-medium text-gray-300">{{__('createbladephp32')}}</label>
                            <select name="locale" id="locale"
                                    class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required>
                                <option value="en" {{ old('locale') == 'en' ? 'selected' : '' }}>{{__('createbladephp35')}}</option>
                                <option value="de" {{ old('locale') == 'de' ? 'selected' : '' }}>{{__('createbladephp36')}}</option>
                                <option value="fr" {{ old('locale') == 'fr' ? 'selected' : '' }}>{{__('createbladephp37')}}</option>
                                <option value="es" {{ old('locale') == 'es' ? 'selected' : '' }}>{{__('createbladephp38')}}</option>
                                <option value="it" {{ old('locale') == 'it' ? 'selected' : '' }}>{{__('createbladephp39')}}</option>
                            </select>
                            @error('locale')
                                <p class="mt-1 text-sm text-red-400">{{ $message }}</p>
                            @enderror
                        </div>

                        <div>
                            <label for="title" class="block text-sm font-medium text-gray-300">{{__('createbladephp47')}}</label>
                            <input type="text" name="title" id="title" value="{{ old('title') }}"
                                   class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                   required>
                            @error('title')
                                <p class="mt-1 text-sm text-red-400">{{ $message }}</p>
                            @enderror
                        </div>

                        <div>
                            <label for="content" class="block text-sm font-medium text-gray-300">Content</label>
                            <textarea name="content" id="content" rows="20"
                                      class="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                      placeholder="Enter your page content here. HTML is supported." required>{{ old('content') }}</textarea>
                            @error('content')
                                <p class="mt-1 text-sm text-red-400">{{ $message }}</p>
                            @enderror
                        </div>

                        <div class="flex items-center">
                            <input type="checkbox" name="is_active" id="is_active" value="1" {{ old('is_active', true) ? 'checked' : '' }}
                                   class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700">
                            <label for="is_active" class="ml-2 block text-sm text-white">
                                {{__('createbladephp70')}}
                            </label>
                        </div>
                    </div>

                    <div class="bg-gray-700 px-4 py-3 text-right sm:px-6">
                        <a href="{{ route('admin.pages.index') }}"
                           class="inline-flex justify-center rounded-md border border-gray-600 bg-gray-800 py-2 px-4 text-sm font-medium text-gray-300 shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            {{__('createbladephp78')}}
                        </a>
                        <button type="submit"
                                class="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            {{__('createbladephp82')}}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection