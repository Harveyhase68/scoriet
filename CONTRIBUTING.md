# Contributing to Scoriet

Thank you for your interest in contributing to **Scoriet**! 🎉

We welcome contributions from the community and are excited to work with you to make Scoriet even better. This guide will help you get started with contributing to our Schema-to-Stack Studio.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue Guidelines](#issue-guidelines)
- [Community Guidelines](#community-guidelines)

## 🚀 Getting Started

### Prerequisites

Before contributing, make sure you have:
- ✅ **PHP** ≥ 8.2 with required extensions
- ✅ **Node.js** ≥ 18.0 and npm ≥ 9.0
- ✅ **Composer** ≥ 2.0
- ✅ **Git** for version control
- ✅ A **GitHub account**
- ✅ Basic knowledge of **Laravel**, **React**, and **TypeScript**

### First Steps

1. **🍴 Fork the Repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR-USERNAME/scoriet.git
   cd scoriet
   ```

2. **🔗 Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/harveyhase68/scoriet.git
   ```

3. **📦 Install Dependencies**
   ```bash
   # Install PHP dependencies
   composer install
   
   # Install Node.js dependencies
   npm install
   ```

4. **⚙️ Environment Setup**
   ```bash
   # Copy environment file
   cp .env.example .env
   
   # Generate application key
   php artisan key:generate
   
   # Set up database (see README.md for details)
   php artisan migrate
   
   # Set up OAuth (see README.md for details)
   php artisan passport:install
   ```

## 🛠️ Development Setup

### Development Workflow

```bash
# Start the development server
composer run dev

# In separate terminals, you can also run individually:
php artisan serve --host=10.0.0.8 --port=8000  # Backend
php artisan queue:listen --tries=1              # Queue worker
npm run dev                                       # Frontend
```

### Branch Strategy

- **`main`** - Production-ready code
- **`develop`** - Integration branch for features (if applicable)
- **Feature branches** - `feature/your-feature-name`
- **Bugfix branches** - `bugfix/issue-description`
- **Hotfix branches** - `hotfix/critical-fix`

### Creating a Feature Branch

```bash
# Make sure you're on main and up to date
git checkout main
git pull upstream main

# Create and switch to your feature branch
git checkout -b feature/amazing-new-feature

# Work on your changes...

# Keep your branch updated (recommended)
git pull upstream main
```

## 📝 Contributing Guidelines

### What Can You Contribute?

- 🐛 **Bug Fixes** - Fix issues and improve stability
- ✨ **New Features** - Add functionality (discuss first!)
- 📚 **Documentation** - Improve docs, add examples
- 🎨 **UI/UX Improvements** - Enhance user experience
- 🧪 **Tests** - Add test coverage
- 🔧 **Developer Experience** - Improve tooling, setup
- 🌍 **Internationalization** - Add language support

### Before Starting

**For Bug Fixes:**
- Check if an issue already exists
- If not, create an issue describing the bug
- Reference the issue in your PR

**For New Features:**
- 📝 **Create an issue first** - Discuss the feature before coding
- 💬 **Get feedback** - Make sure it aligns with project goals
- 🎯 **Start small** - Break large features into smaller PRs

**For Documentation:**
- Fix typos, improve clarity
- Add missing documentation
- Update outdated information

## 📏 Code Standards

### General Principles

- **Keep it simple** - Prefer clarity over cleverness
- **Follow existing patterns** - Maintain consistency
- **Test your code** - Ensure quality and stability
- **Document complex logic** - Help future maintainers
- **Performance matters** - Consider impact of changes

### PHP/Laravel Standards

- ✅ **Follow PSR-12** - Use Laravel Pint for formatting
- ✅ **Use type hints** - Always declare types
- ✅ **Follow Laravel conventions** - Eloquent, naming, etc.
- ✅ **Write descriptive names** - Clear variable and method names
- ✅ **Keep methods small** - Single responsibility principle

```bash
# Format PHP code
./vendor/bin/pint

# Check formatting without changes
./vendor/bin/pint --test
```

### JavaScript/TypeScript Standards

- ✅ **Use TypeScript** - Always add proper types
- ✅ **Follow ESLint rules** - Consistent code style
- ✅ **Use Prettier** - Automatic formatting
- ✅ **React best practices** - Hooks, functional components
- ✅ **Meaningful component names** - Clear and descriptive

```bash
# Lint and auto-fix JavaScript/TypeScript
npm run lint

# Format code with Prettier
npm run format

# Type checking
npm run types
```

### Commit Messages

Use **Conventional Commits** format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `test` - Adding missing tests
- `chore` - Changes to build process or auxiliary tools

**Examples:**
```bash
feat(auth): add password reset functionality
fix(ui): resolve mobile navigation overflow issue
docs(readme): update installation instructions
style(components): format with prettier
test(parser): add tests for SQL parsing edge cases
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
composer run test

# Run with coverage
php artisan test --coverage

# Run specific test types
php artisan test --testsuite=Feature
php artisan test --testsuite=Unit

# Frontend tests (when available)
npm test
```

### Writing Tests

- **Write tests for new features** - Ensure they work correctly
- **Add tests for bug fixes** - Prevent regressions
- **Test edge cases** - Consider unusual inputs
- **Keep tests focused** - One concept per test
- **Use descriptive test names** - Clear what's being tested

### Test Structure

```php
// Feature test example
test('user can register with valid credentials', function () {
    $userData = [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ];

    $response = $this->post('/api/auth/register', $userData);

    $response->assertStatus(201);
    $this->assertDatabaseHas('users', ['email' => 'john@example.com']);
});
```

## 🚀 Submitting Changes

### Pre-submission Checklist

Before creating a Pull Request:

- [ ] ✅ **Tests pass** - `composer run test`
- [ ] ✅ **Code is formatted** - `./vendor/bin/pint && npm run format`
- [ ] ✅ **No linting errors** - `npm run lint`
- [ ] ✅ **Types are valid** - `npm run types`
- [ ] ✅ **Branch is up to date** - `git pull upstream main`
- [ ] ✅ **Commit messages follow convention**
- [ ] ✅ **Documentation is updated** (if needed)

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Select your feature branch
   - Target the `main` branch

3. **Fill out the PR template**
   - **Title** - Clear, concise description
   - **Description** - What changes were made and why
   - **Testing** - How to test the changes
   - **Screenshots** - For UI changes
   - **Breaking Changes** - If any

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally with my changes
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
```

## 📝 Issue Guidelines

### Reporting Bugs

**Before reporting:**
- Search existing issues to avoid duplicates
- Try to reproduce the issue
- Test with the latest version

**Bug report should include:**
- **Clear title** - Concise description of the issue
- **Steps to reproduce** - Detailed steps to trigger the bug
- **Expected behavior** - What should happen
- **Actual behavior** - What actually happens
- **Environment details** - OS, PHP version, browser, etc.
- **Screenshots/logs** - If applicable

### Feature Requests

**Before requesting:**
- Check if it already exists or is planned
- Consider if it fits the project scope
- Think about implementation complexity

**Feature request should include:**
- **Problem description** - What problem does this solve?
- **Proposed solution** - How would you like it to work?
- **Alternatives considered** - Other approaches you've thought of
- **Use cases** - When would this be useful?

### Issue Labels

- 🐛 `bug` - Something isn't working
- ✨ `enhancement` - New feature or request
- 📚 `documentation` - Improvements or additions to docs
- 🚀 `good first issue` - Good for newcomers
- 🆘 `help wanted` - Extra attention is needed
- 🔧 `maintenance` - Maintenance and refactoring
- ⚡ `performance` - Performance improvements
- 🔒 `security` - Security-related issues

## 🤝 Community Guidelines

### Code of Conduct

- **Be respectful** - Treat everyone with respect
- **Be constructive** - Provide helpful feedback
- **Be patient** - Remember that everyone is learning
- **Be inclusive** - Welcome contributors of all skill levels
- **Be professional** - Keep discussions focused and civil

### Communication

- **GitHub Issues** - For bugs, features, and questions
- **Pull Requests** - For code discussions
- **Email** - For private matters: [support@scoriet.com](mailto:support@scoriet.com)

### Review Process

- **Maintainers review PRs** - Usually within 1-3 days
- **Feedback is constructive** - Aimed at improving code quality
- **Discussion is encouraged** - Feel free to ask questions
- **Changes may be requested** - Part of the process
- **Final approval required** - Before merging

### Recognition

We appreciate all contributions! Contributors will be:
- 🌟 **Listed in CONTRIBUTORS.md** (coming soon)
- 🎉 **Mentioned in release notes** (for significant contributions)
- 💝 **Thanked publicly** on social media (if desired)

---

## 🆘 Need Help?

- 📖 **Read the [README.md](README.md)** for setup instructions
- 🐛 **Check [existing issues](https://github.com/harveyhase68/scoriet/issues)** for solutions
- 💬 **Start a [discussion](https://github.com/harveyhase68/scoriet/discussions)** for questions
- 📧 **Email us** at [support@scoriet.com](mailto:support@scoriet.com)

## 🙏 Thank You!

Your contributions make Scoriet better for everyone. Whether you're fixing a small typo or adding a major feature, every contribution matters and is appreciated! 

Welcome to the Scoriet community! 🚀

---

<div align="center">

*Made with ❤️ by the Scoriet community*

**[⭐ Star the project](https://github.com/harveyhase68/scoriet)** if you find it helpful!

</div>