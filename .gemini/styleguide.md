# Alexander Predl PHP Laravel, React, TypeScript Style Guide

## Introduction
This style guide defines the coding conventions for projects developed by Alexander Predl.
It is primarily based on **PSR-12** for PHP and **Airbnb + Prettier** for TypeScript/React.

## Key Principles
* **Readability:** Code must be easy to understand for all developers.
* **Maintainability:** Code should be simple to extend and modify.
* **Consistency:** Use a uniform style across all files and languages.
* **Performance:** Write readable but efficient code.
* **Linting:** Code must remain free of linter errors and warnings.
* **GitHub:** The project is hosted on GitHub, but no uploads or commits may be performed unless explicitly approved by the developer.

## Imports
* Keep standard imports (e.g. i18n, PrimeReact).
* New imports or dependencies require approval from the developer.
* In TypeScript, always use **explicit imports** – avoid `import * as ...`.

## Naming Conventions

### PHP (Laravel)
* Variables: `camelCase`
* Constants: `UPPER_CASE`
* Functions / Methods: `camelCase()`
* Classes: `PascalCase`
* Files: `snake_case.php` (except PSR-4 autoloaded classes, which use `PascalCase.php`)
* Namespaces: `PascalCase`

### TypeScript / React
* Variables: `camelCase`
* Constants: `UPPER_CASE` (only for exported/global constants)
* Functions: `camelCase()`
* Classes / Components: `PascalCase`
* Interfaces / Types: `PascalCase`
* Files: `kebab-case.ts(x)`
* Avoid default exports for React components – prefer named exports.

## Comments
* Write **clear, concise** comments that explain **why**, not **what**.
* Prefer self-explanatory code over excessive comments.
* Use **complete sentences** starting with a capital letter and proper punctuation.
* In PHP, use `/** ... */` for docblocks above methods and classes when appropriate.

## Logging
* **Laravel:** use the built-in `Log` facade (`Log::info()`, `Log::error()`, etc.).
* **React/TypeScript:** use `console.debug()`, `console.warn()`, `console.error()` only during development.
* Provide **context** in log messages to simplify debugging.
* Do **not** use the Python `logging` module — it does not apply here.

## Error Handling
* Use **specific exceptions** (e.g. `ModelNotFoundException`, `ValidationException`).
* Always **catch** only what you can handle meaningfully.
* Provide **user-friendly** error messages but avoid exposing sensitive data.
* In React/TypeScript, prefer `try/catch` with meaningful error logging or boundary components.

## Tooling
* **PHP:** Use `Laravel Pint` or `php-cs-fixer` to enforce PSR-12.
* **TypeScript/React:** Run `npm run lint` for ESLint + Prettier checks.
* **Formatter:** Prettier is the single source of truth for code formatting.
* **EditorConfig:** All files should follow the project’s `.editorconfig`.

## GitHub
* The repository is hosted on GitHub.
* Do **not** upload, push, or commit any code unless explicitly instructed by the developer.
* Treat GitHub as a **read-only backup** unless otherwise stated.
