<?php

/**
 * Edit Mask Presets per Target Programming Language/Framework
 *
 * Each framework has its own mask syntax.
 * The user selects a preset (e.g. "Date") and the mask value is auto-filled.
 * The user can always manually edit the mask value.
 */

return [
    // Available target languages/frameworks
    'languages' => [
        ['value' => 'html', 'label' => 'HTML (pattern attribute)'],
        ['value' => 'react_primereact', 'label' => 'React / PrimeReact InputMask'],
        ['value' => 'react_imask', 'label' => 'React / react-imask'],
        ['value' => 'vue_maska', 'label' => 'Vue.js / Maska'],
        ['value' => 'vue_primevue', 'label' => 'Vue.js / PrimeVue InputMask'],
        ['value' => 'vue_vuetify', 'label' => 'Vue.js / Vuetify'],
        ['value' => 'vue_quasar', 'label' => 'Vue.js / Quasar'],
        ['value' => 'angular_ngxmask', 'label' => 'Angular / ngx-mask'],
        ['value' => 'angular_imask', 'label' => 'Angular / imaskjs'],
        ['value' => 'jquery_mask', 'label' => 'jQuery Mask Plugin'],
        ['value' => 'vanilla_js', 'label' => 'Vanilla JavaScript'],
    ],

    // Presets per framework
    'presets' => [
        'html' => [
            ['key' => 'date', 'label' => 'Date (DD/MM/YYYY)', 'mask' => '\\d{1,2}/\\d{1,2}/\\d{4}'],
            ['key' => 'date_iso', 'label' => 'Date (YYYY-MM-DD)', 'mask' => '\\d{4}-\\d{2}-\\d{2}'],
            ['key' => 'date_eu', 'label' => 'Date (DD.MM.YYYY)', 'mask' => '\\d{1,2}\\.\\d{1,2}\\.\\d{4}'],
            ['key' => 'time', 'label' => 'Time (HH:MM)', 'mask' => '\\d{2}:\\d{2}'],
            ['key' => 'datetime', 'label' => 'DateTime', 'mask' => '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}'],
            ['key' => 'email', 'label' => 'Email', 'mask' => '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'],
            ['key' => 'phone', 'label' => 'Phone International', 'mask' => '\\+?[0-9\\s\\-()]{7,20}'],
            ['key' => 'phone_at', 'label' => 'Phone (AT)', 'mask' => '\\+43\\s?[0-9\\s]{4,12}'],
            ['key' => 'phone_de', 'label' => 'Phone (DE)', 'mask' => '\\+49\\s?[0-9\\s]{4,12}'],
            ['key' => 'iban', 'label' => 'IBAN', 'mask' => '[A-Z]{2}\\d{2}[A-Z0-9]{4,30}'],
            ['key' => 'zip', 'label' => 'ZIP Code (4-5 digits)', 'mask' => '\\d{4,5}'],
            ['key' => 'zip_at', 'label' => 'ZIP (AT, 4 digits)', 'mask' => '\\d{4}'],
            ['key' => 'zip_de', 'label' => 'ZIP (DE, 5 digits)', 'mask' => '\\d{5}'],
            ['key' => 'creditcard', 'label' => 'Credit Card', 'mask' => '\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}'],
            ['key' => 'ip4', 'label' => 'IPv4 Address', 'mask' => '((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)'],
            ['key' => 'ip6', 'label' => 'IPv6 Address', 'mask' => '([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}'],
            ['key' => 'integer', 'label' => 'Integer', 'mask' => '-?\\d+'],
            ['key' => 'float', 'label' => 'Float/Decimal', 'mask' => '-?\\d+[.,]?\\d*'],
            ['key' => 'currency', 'label' => 'Currency (0.00)', 'mask' => '\\d+[.,]\\d{2}'],
            ['key' => 'currency_sym', 'label' => 'Currency with Symbol', 'mask' => '[€$£]?\\s?\\d+[.,]\\d{2}'],
            ['key' => 'url', 'label' => 'URL', 'mask' => 'https?://.+'],
            ['key' => 'hex_color', 'label' => 'Hex Color', 'mask' => '#[0-9a-fA-F]{6}'],
            ['key' => 'alpha', 'label' => 'Letters Only', 'mask' => '[a-zA-Z]+'],
            ['key' => 'alphanumeric', 'label' => 'Alphanumeric', 'mask' => '[a-zA-Z0-9]+'],
        ],

        'react_primereact' => [
            ['key' => 'date_eu', 'label' => 'Date (DD.MM.YYYY)', 'mask' => '99.99.9999'],
            ['key' => 'date_us', 'label' => 'Date (MM/DD/YYYY)', 'mask' => '99/99/9999'],
            ['key' => 'date_iso', 'label' => 'Date (YYYY-MM-DD)', 'mask' => '9999-99-99'],
            ['key' => 'time', 'label' => 'Time (HH:MM)', 'mask' => '99:99'],
            ['key' => 'time_sec', 'label' => 'Time (HH:MM:SS)', 'mask' => '99:99:99'],
            ['key' => 'datetime', 'label' => 'DateTime', 'mask' => '9999-99-99 99:99'],
            ['key' => 'phone', 'label' => 'Phone International', 'mask' => '+99 999 9999999'],
            ['key' => 'phone_at', 'label' => 'Phone (AT)', 'mask' => '+43 999 9999999'],
            ['key' => 'phone_de', 'label' => 'Phone (DE)', 'mask' => '+49 999 99999999'],
            ['key' => 'iban', 'label' => 'IBAN', 'mask' => 'aa99 aaaa 9999 9999 9999 9999 99'],
            ['key' => 'zip_at', 'label' => 'ZIP (AT)', 'mask' => '9999'],
            ['key' => 'zip_de', 'label' => 'ZIP (DE)', 'mask' => '99999'],
            ['key' => 'creditcard', 'label' => 'Credit Card', 'mask' => '9999 9999 9999 9999'],
            ['key' => 'ip4', 'label' => 'IPv4', 'mask' => '999.999.999.999'],
            ['key' => 'currency', 'label' => 'Currency', 'mask' => '9?9?9?9?9,99'],
            ['key' => 'hex_color', 'label' => 'Hex Color', 'mask' => '#aaaaaa'],
        ],

        'react_imask' => [
            ['key' => 'date', 'label' => 'Date (MaskedDate)', 'mask' => '{IMask.MaskedDate}'],
            ['key' => 'phone', 'label' => 'Phone', 'mask' => '+{43} 000 0000000'],
            ['key' => 'integer', 'label' => 'Integer', 'mask' => '{IMask.MaskedNumber}'],
            ['key' => 'currency', 'label' => 'Currency', 'mask' => '{IMask.MaskedNumber, scale:2, thousandsSeparator:"."}'],
            ['key' => 'zip_at', 'label' => 'ZIP (AT)', 'mask' => '0000'],
            ['key' => 'zip_de', 'label' => 'ZIP (DE)', 'mask' => '00000'],
            ['key' => 'creditcard', 'label' => 'Credit Card', 'mask' => '0000 0000 0000 0000'],
        ],

        'vue_maska' => [
            ['key' => 'date_eu', 'label' => 'Date (DD.MM.YYYY)', 'mask' => '##.##.####'],
            ['key' => 'date_us', 'label' => 'Date (MM/DD/YYYY)', 'mask' => '##/##/####'],
            ['key' => 'time', 'label' => 'Time (HH:MM)', 'mask' => '##:##'],
            ['key' => 'phone', 'label' => 'Phone', 'mask' => '+## ### #######'],
            ['key' => 'zip_at', 'label' => 'ZIP (AT)', 'mask' => '####'],
            ['key' => 'zip_de', 'label' => 'ZIP (DE)', 'mask' => '#####'],
            ['key' => 'creditcard', 'label' => 'Credit Card', 'mask' => '#### #### #### ####'],
            ['key' => 'ip4', 'label' => 'IPv4', 'mask' => '###.###.###.###'],
        ],

        'vue_primevue' => [
            ['key' => 'date_eu', 'label' => 'Date (DD.MM.YYYY)', 'mask' => '99.99.9999'],
            ['key' => 'date_us', 'label' => 'Date (MM/DD/YYYY)', 'mask' => '99/99/9999'],
            ['key' => 'time', 'label' => 'Time', 'mask' => '99:99'],
            ['key' => 'phone', 'label' => 'Phone', 'mask' => '+99 999 9999999'],
            ['key' => 'zip_at', 'label' => 'ZIP (AT)', 'mask' => '9999'],
            ['key' => 'zip_de', 'label' => 'ZIP (DE)', 'mask' => '99999'],
            ['key' => 'creditcard', 'label' => 'Credit Card', 'mask' => '9999 9999 9999 9999'],
        ],

        'vue_vuetify' => [
            ['key' => 'date_eu', 'label' => 'Date (DD.MM.YYYY)', 'mask' => '##.##.####'],
            ['key' => 'time', 'label' => 'Time', 'mask' => '##:##'],
            ['key' => 'phone', 'label' => 'Phone', 'mask' => '+## ### #######'],
            ['key' => 'zip', 'label' => 'ZIP', 'mask' => '#####'],
        ],

        'vue_quasar' => [
            ['key' => 'date_eu', 'label' => 'Date (DD.MM.YYYY)', 'mask' => '##.##.####'],
            ['key' => 'time', 'label' => 'Time', 'mask' => '##:##'],
            ['key' => 'phone', 'label' => 'Phone', 'mask' => '+## ### #######'],
            ['key' => 'creditcard', 'label' => 'Credit Card', 'mask' => '#### #### #### ####'],
        ],

        'angular_ngxmask' => [
            ['key' => 'date_eu', 'label' => 'Date (DD.MM.YYYY)', 'mask' => 'd0.M0.0000'],
            ['key' => 'date_us', 'label' => 'Date (MM/DD/YYYY)', 'mask' => 'M0/d0/0000'],
            ['key' => 'time', 'label' => 'Time (HH:MM)', 'mask' => 'Hh:m0'],
            ['key' => 'phone', 'label' => 'Phone', 'mask' => '+00 000 0000000'],
            ['key' => 'zip_at', 'label' => 'ZIP (AT)', 'mask' => '0000'],
            ['key' => 'zip_de', 'label' => 'ZIP (DE)', 'mask' => '00000'],
            ['key' => 'creditcard', 'label' => 'Credit Card', 'mask' => '0000 0000 0000 0000'],
            ['key' => 'ip4', 'label' => 'IPv4', 'mask' => '099.099.099.099'],
            ['key' => 'currency', 'label' => 'Currency', 'mask' => 'separator.2'],
        ],

        'angular_imask' => [
            ['key' => 'date', 'label' => 'Date', 'mask' => '{IMask.MaskedDate}'],
            ['key' => 'phone', 'label' => 'Phone', 'mask' => '+{43} 000 0000000'],
            ['key' => 'integer', 'label' => 'Integer', 'mask' => '{IMask.MaskedNumber}'],
            ['key' => 'currency', 'label' => 'Currency', 'mask' => '{IMask.MaskedNumber, scale:2}'],
        ],

        'jquery_mask' => [
            ['key' => 'date_eu', 'label' => 'Date (DD.MM.YYYY)', 'mask' => '00.00.0000'],
            ['key' => 'date_us', 'label' => 'Date (MM/DD/YYYY)', 'mask' => '00/00/0000'],
            ['key' => 'time', 'label' => 'Time (HH:MM)', 'mask' => '00:00'],
            ['key' => 'time_sec', 'label' => 'Time (HH:MM:SS)', 'mask' => '00:00:00'],
            ['key' => 'phone', 'label' => 'Phone', 'mask' => '+00 000 0000000'],
            ['key' => 'zip_at', 'label' => 'ZIP (AT)', 'mask' => '0000'],
            ['key' => 'zip_de', 'label' => 'ZIP (DE)', 'mask' => '00000'],
            ['key' => 'creditcard', 'label' => 'Credit Card', 'mask' => '0000 0000 0000 0000'],
            ['key' => 'ip4', 'label' => 'IPv4', 'mask' => '099.099.099.099'],
            ['key' => 'currency', 'label' => 'Currency', 'mask' => '#.##0,00'],
            ['key' => 'currency_us', 'label' => 'Currency (US)', 'mask' => '#,##0.00'],
        ],

        'vanilla_js' => [
            ['key' => 'date_eu', 'label' => 'Date (DD.MM.YYYY)', 'mask' => '\\d{2}\\.\\d{2}\\.\\d{4}'],
            ['key' => 'email', 'label' => 'Email', 'mask' => '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'],
            ['key' => 'phone', 'label' => 'Phone', 'mask' => '\\+?[0-9\\s\\-()]{7,20}'],
            ['key' => 'integer', 'label' => 'Integer', 'mask' => '-?\\d+'],
            ['key' => 'float', 'label' => 'Float', 'mask' => '-?\\d+[.,]?\\d*'],
            ['key' => 'url', 'label' => 'URL', 'mask' => 'https?://.+'],
        ],
    ],
];
