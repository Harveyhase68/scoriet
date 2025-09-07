# Security Policy

## 🔒 Security at Scoriet

We take the security of Scoriet seriously. As an enterprise code generator handling sensitive data like database schemas, authentication tokens, and user-generated templates, we are committed to maintaining the highest security standards.

## 🛡️ Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| Latest (main branch) | ✅ |
| Alpha releases       | ✅ |
| Development builds   | ❌ |

> **Note**: As Scoriet is currently in active development, we focus security updates on the latest stable builds. Once we reach v1.0, we will provide a more detailed support matrix.

## 🚨 Reporting Security Vulnerabilities

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

### Preferred Reporting Method

Please report security vulnerabilities via email to:

**📧 security@scoriet.dev**

### Alternative Reporting Method

If the primary email is not available, you can also reach us at:

**📧 office@scoriet.com** (Subject: "SECURITY VULNERABILITY - CONFIDENTIAL")

### What to Include

When reporting a security vulnerability, please include:

- **Description** - Clear description of the vulnerability
- **Impact Assessment** - Potential impact and affected components
- **Steps to Reproduce** - Detailed steps to reproduce the issue
- **Proof of Concept** - Code snippets or screenshots (if applicable)
- **Suggested Fix** - If you have ideas for remediation
- **Your Contact Information** - For follow-up questions
- **Disclosure Timeline** - Your preferred timeline for public disclosure

### Example Report Format

```
Subject: Security Vulnerability in Authentication System

Description:
SQL injection vulnerability in user login endpoint

Impact:
- Unauthorized access to user accounts
- Potential database compromise
- Affects all users

Steps to Reproduce:
1. Navigate to login page
2. Enter malicious payload in email field: [payload]
3. Submit form
4. Observe database query execution

Environment:
- Version: Latest main branch
- OS: Ubuntu 20.04
- Browser: Chrome 120

Suggested Fix:
Implement prepared statements in AuthController::login()
```

## ⏱️ Response Timeline

We are committed to responding to security reports promptly:

- **Initial Response**: Within **24 hours** of receiving your report
- **Vulnerability Assessment**: Within **72 hours** of initial response
- **Status Update**: Weekly updates until resolution
- **Fix Timeline**: Critical issues within **7 days**, others within **30 days**
- **Public Disclosure**: **90 days** after fix is released (coordinated disclosure)

## 🏆 Security Hall of Fame

We recognize and appreciate security researchers who help keep Scoriet secure. With your permission, we will acknowledge your contribution in:

- **GitHub Security Advisories**
- **Release Notes** for security fixes
- **Security Hall of Fame** (coming soon)
- **Social Media Recognition** (if desired)

*No monetary rewards are currently offered, but recognition and our sincere gratitude are guaranteed!*

## 🎯 Security Scope

### In Scope

The following components are within our security scope:

- **Authentication System** (Laravel Passport, JWT tokens)
- **User Management** (Registration, login, profiles)
- **Database Access** (SQL parser, schema handling)
- **Template System** (Code generation, file handling)
- **API Endpoints** (All `/api/*` routes)
- **File Uploads** (Template and schema imports)
- **Session Management** (Token storage, refresh)

### Out of Scope

The following are generally **not** considered security issues:

- **Demo Environment** (`demo.scoriet.dev`) - Resets every 20 minutes
- **Development Dependencies** - Unless they affect production builds
- **Social Engineering** - Issues requiring user interaction beyond normal usage
- **Physical Security** - Server infrastructure (managed by hosting providers)
- **Third-party Services** - External APIs and services we integrate with
- **Rate Limiting** - Unless it leads to DoS or resource exhaustion
- **Clickjacking** - On non-sensitive pages without state changes

## 🛠️ Security Measures

### Current Security Implementations

- **🔐 OAuth2 Authentication** - Laravel Passport with Password Grant
- **🔑 JWT Token Management** - Secure token storage and refresh
- **🛡️ CSRF Protection** - Laravel's built-in CSRF protection
- **🔒 SQL Injection Prevention** - Eloquent ORM and prepared statements
- **📝 Input Validation** - Server-side validation for all inputs
- **🚫 XSS Protection** - React's built-in XSS prevention
- **🔐 Password Security** - Bcrypt hashing with appropriate rounds
- **🌐 HTTPS Enforcement** - SSL/TLS in production environments

### Planned Security Enhancements

- **🔍 Security Headers** - Content Security Policy (CSP), HSTS
- **⚡ Rate Limiting** - API endpoint protection
- **📊 Security Logging** - Comprehensive audit trails
- **🔐 Two-Factor Authentication** - Optional 2FA for enhanced security
- **🛡️ Web Application Firewall** - Additional layer of protection

## 🚀 Security Best Practices for Users

### For Administrators

- **Keep Updated** - Always use the latest version
- **Secure Hosting** - Use reputable hosting providers with security features
- **HTTPS Only** - Never run Scoriet over HTTP in production
- **Strong Passwords** - Enforce strong password policies
- **Regular Backups** - Maintain secure, tested backups
- **Monitor Logs** - Regularly review application and server logs

### For Developers

- **Environment Files** - Never commit `.env` files with real credentials
- **API Keys** - Rotate API keys regularly
- **Dependencies** - Keep all dependencies updated
- **Code Review** - Review security-related changes carefully
- **Testing** - Include security testing in your workflow

## 📞 Contact Information

For security-related inquiries:

- **Security Team**: security@scoriet.com
- **General Support**: support@scoriet.com
- **Project Maintainer**: Via GitHub @harveyhase68

## 📚 Resources

- **Laravel Security**: https://laravel.com/docs/security
- **React Security**: https://react.dev/learn/security
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **GitHub Security**: https://docs.github.com/en/code-security

---

## 🙏 Thank You

We appreciate the security community's efforts to responsibly disclose vulnerabilities. Your contributions help make Scoriet safer for everyone.

**Together, we build secure software.** 🛡️

---

<div align="center">

*This security policy was last updated: January 2025*

**[Report a Security Issue](mailto:security@scoriet.com)** | **[View Security Advisories](https://github.com/harveyhase68/scoriet/security/advisories)**

</div>