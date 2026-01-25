# Changelog

All notable changes to the "Scoriet Template Language" extension will be documented in this file.

## [1.2.0] - 2026-01-24

### Added
- **Include constructs**: `{:include: path/file.ext:}` to embed reusable template snippets
- Include-Only files: Template files that are only used for includes, not generated separately

## [1.1.0] - 2026-01-23

### Changed
- **BREAKING CHANGE**: Updated template syntax from `{tagname}` to `{:tagname:}` to avoid conflicts with Twig and other template engines
- All template constructs now use the new `{:...:}` format:
  - Variables: `{:projectname:}`, `{:tablename:}`, etc.
  - Dotted notation: `{:item.name:}`, `{:field.type:}`, etc.
  - Loops: `{:for nmaxitems:}...{:endfor:}` (counter without extra delimiters)
  - Conditionals: `{:if item.typecast=="(int)":}` (variables without extra delimiters)
  - Switch/case: `{:switch item.type:}...{:case:}...{:endswitch:}`
  - Code blocks: `{:code:}...{:codeend:}`
  - Functions: `{:upper(varname):}`, `{:capitalize(name):}`, etc.
  - Counters: `{:nmaxitems:}`, `{:nmaxkeys:}`, etc.
  - German keywords: `{:wenn:}`, `{:endwenn:}`, `{:sonst:}`

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
