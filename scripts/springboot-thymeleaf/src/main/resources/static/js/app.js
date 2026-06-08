/* {:projectcaption:} - small UI glue (theme, CSRF for htmx, modal handling) */
(function () {
    'use strict';

    /* --- light / dark theme toggle (Bootstrap 5.3 color modes) --- */
    const storedTheme = localStorage.getItem('scoriet-theme');
    if (storedTheme) {
        document.documentElement.setAttribute('data-bs-theme', storedTheme);
    }

    document.addEventListener('DOMContentLoaded', function () {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            updateThemeIcon(toggle);
            toggle.addEventListener('click', function () {
                const next = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-bs-theme', next);
                localStorage.setItem('scoriet-theme', next);
                updateThemeIcon(toggle);
            });
        }
    });

    function updateThemeIcon(toggle) {
        const dark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
        toggle.innerHTML = dark ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
    }

    /* --- htmx: send Spring Security CSRF token with every request --- */
    document.body.addEventListener('htmx:configRequest', function (event) {
        const token = document.querySelector('meta[name="_csrf"]');
        const header = document.querySelector('meta[name="_csrf_header"]');
        if (token && header) {
            event.detail.headers[header.content] = token.content;
        }
    });

    /* --- htmx: allow 422 responses (validation errors) to swap the form back in --- */
    document.body.addEventListener('htmx:beforeSwap', function (event) {
        if (event.detail.xhr.status === 422) {
            event.detail.shouldSwap = true;
            event.detail.isError = false;
        }
    });

    /* --- customer modal: open after the form fragment was loaded, close after save --- */
    document.body.addEventListener('htmx:afterSwap', function (event) {
        if (event.detail.target.id === 'modalContent') {
            bootstrap.Modal.getOrCreateInstance(document.getElementById('crudModal')).show();
        }
    });

    document.body.addEventListener('crud-changed', function () {
        const modalElement = document.getElementById('crudModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }
    });
})();
