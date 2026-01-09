# Changelog

All notable changes to the "Scoriet Template Language" extension will be documented in this file.

## [1.0.0] - 2026-01-01

### Added
- Initial release
- Syntax highlighting for Scoriet template placeholders
- Support for simple variables: `{projectname}`, `{tablename}`, etc.
- Support for dotted notation: `{item.name}`, `{field.type}`, etc.
- Support for loop constructs: `{for}...{endfor}`
- Support for conditionals: `{if}...{elseif}...{else}...{endif}`
- Support for switch/case: `{switch}...{case}...{default}...{endswitch}`
- Support for built-in functions: `{upper()}`, `{capitalize()}`, etc.
- Support for code blocks: `{code}...{codeend}`
- Support for counter variables: `{nmaxitems}`, `{nmaxkeys}`, etc.
- Injection into 30+ programming languages (PHP, TypeScript, JavaScript, C++, Python, etc.)
- German keywords support: `{wenn}`, `{endwenn}`, `{sonst}`
