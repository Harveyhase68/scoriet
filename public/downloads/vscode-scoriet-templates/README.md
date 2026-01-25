# Scoriet Template Language for VS Code

Syntax highlighting for Scoriet template placeholders in any programming language.

## Features

This extension injects Scoriet template syntax highlighting into:
- **PHP**, **TypeScript**, **JavaScript**, **C++**, **C#**, **Java**
- **Python**, **Go**, **Rust**, **Ruby**, **Swift**, **Kotlin**
- **SQL**, **HTML**, **CSS**, **SCSS**, **Vue**, **Svelte**
- And many more!

### Supported Syntax

#### Simple Placeholders
```
{:projectname:}
{:tablename:}
{:filename:}
```

#### Object Properties (Dotted Notation)
```
{:item.name:}
{:field.type:}
{:project.tables:}
{:form.element.property:}
```

#### Loop Constructs
```
{:for nmaxitems:}
  {:item.name:}: {:item.type:}
{:endfor:}

{:for %:}
  ...
{:endfor:}
```

#### Conditionals
```
{:if item.phptype eq 'string':}
  ...
{:elseif item.phptype eq 'int':}
  ...
{:else:}
  ...
{:endif:}
```

#### Switch/Case
```
{:switch item.controltype:}
{:case 14:}
  Text field
{:case 24:}
  Numeric field
{:default:}
  Unknown
{:endswitch:}
```

#### Built-in Functions
```
{:upper(tablename):}
{:capitalize(item.name):}
{:camelcase(field.name):}
{:substr(item.name, 0, -3):}
{:replace(tablename, '_', '-'):}
```

#### JavaScript Code Blocks
```
{:code:}
  // Your JavaScript code here
  let result = processData();
  sContentResult += result;
{:codeend:}
```

#### Counter Variables
```
{:nmaxitems:}
{:nmaxkeys:}
{:nmaxforeignkeys:}
{:nmaxtables:}
{:nmaxlanguages:}
```

#### Include Constructs
Include reusable template snippets from other files:
```
{:include: /includes/header.php:}
{:include: lib/validation.php:}
{:include: helper.php:}
```

**Note:** Include files must be marked as "Include-Only" in the template editor. They will not be generated as separate files, only embedded where referenced.

## Installation

### From VSIX file
1. Download `scoriet-templates-1.0.0.vsix`
2. Open VS Code
3. Press `Ctrl+Shift+P` and type "Install from VSIX"
4. Select the downloaded file

### Manual Installation
1. Copy the extension folder to:
   - Windows: `%USERPROFILE%\.vscode\extensions\scoriet-templates`
   - macOS/Linux: `~/.vscode/extensions/scoriet-templates`
2. Restart VS Code

## Color Themes

The extension uses semantic token colors that work with most themes:
- **Keywords** (`for`, `if`, `switch`, etc.): Purple/Magenta
- **Variables**: Orange/Yellow
- **Functions**: Blue
- **Counters**: Green
- **Punctuation** (`{:`, `:}`): Gray

## Requirements

- VS Code 1.60.0 or higher

## Release Notes

### 1.1.0
- Updated syntax from `{tagname}` to `{:tagname:}` to avoid conflicts with Twig and other template engines

### 1.0.0
- Initial release
- Full syntax highlighting for Scoriet template language
- Injection into 30+ programming languages
- Support for all template constructs

## About Scoriet

Scoriet is an Enterprise Code Generator that automates code generation through intelligent templating. Learn more at [scoriet.com](https://scoriet.com).

## License

MIT License - Free to use in any project.
