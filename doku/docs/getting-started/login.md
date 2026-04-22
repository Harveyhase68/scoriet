---
sidebar_position: 2
title: Logging In
---

# Logging In to Scoriet

Once you've created your account, logging in is quick and secure. This guide covers login, password recovery, and managing your session.

## Your First Login

### Step 1: Go to the Login Page

Visit the Scoriet homepage and click the **"Login"** button in the top right corner, or navigate directly to the login page.

<div class="screenshot-placeholder">Screenshot: Scoriet login page — <code>login-page.png</code></div>

### Step 2: Enter Your Credentials

You'll see two fields on the login form:

1. **Email Address** – Enter the email you used during registration
2. **Password** – Enter your password (case-sensitive)

Make sure you type these carefully. Passwords are case-sensitive, so "MyPassword" is different from "mypassword".

<div class="screenshot-placeholder">Screenshot: Login form with email and password fields — <code>login-form.png</code></div>

:::tip **Using a Password Manager?**
We recommend using a password manager like 1Password, LastPass, or Bitwarden. They auto-fill your credentials securely and generate strong passwords.
:::

### Step 3: Click "Sign In"

Once you've entered your email and password, click the **"Sign In"** button. Scoriet uses OAuth2 authentication to verify your credentials securely.

<div class="screenshot-placeholder">Screenshot: Sign In button highlighted — <code>sign-in-button.png</code></div>

### Step 4: You're In!

After a brief moment, you'll be redirected to the Scoriet dashboard. Congratulations—you're now logged in and ready to start generating code!

<div class="screenshot-placeholder">Screenshot: Scoriet dashboard after successful login — <code>dashboard.png</code></div>

## Understanding Your Session

When you log in, Scoriet creates a secure session using **JWT (JSON Web Tokens)**. Here's what that means for you:

- **Automatic Login** – You stay logged in as you work, without needing to re-enter credentials repeatedly
- **Secure Tokens** – Your session token is encrypted and stored safely in your browser
- **Auto-Logout** – For security, sessions automatically expire after a period of inactivity (typically 24 hours)
- **One-Click Logout** – You can manually logout anytime from your profile menu

:::note **Token Refresh**
Scoriet automatically refreshes your session token in the background. You shouldn't see any interruptions during your work day.
:::

## Forgot Your Password?

Don't worry—it happens! Here's how to reset your password:

### Step 1: Click "Forgot Password?"

On the login page, below the login button, you'll see a **"Forgot your password?"** link. Click it.

<div class="screenshot-placeholder">Screenshot: Forgot password link on login page — <code>forgot-password-link.png</code></div>

### Step 2: Enter Your Email

You'll be taken to the password reset page. Enter the email address associated with your Scoriet account and click **"Send Reset Link"**.

<div class="screenshot-placeholder">Screenshot: Password reset form — <code>password-reset-form.png</code></div>

### Step 3: Check Your Email

Scoriet will send a password reset email to your inbox. Click the **"Reset Password"** link in the email.

<div class="screenshot-placeholder">Screenshot: Password reset email — <code>password-reset-email.png</code></div>

:::caution **Reset Link Expires**
For security, password reset links are only valid for 24 hours. If the link has expired, repeat the process to get a new one.
:::

### Step 4: Create a New Password

You'll be redirected to a form where you can enter your new password. Make sure it's secure and different from your old password.

Enter it twice to confirm, then click **"Set New Password"**.

<div class="screenshot-placeholder">Screenshot: New password form — <code>new-password-form.png</code></div>

### Step 5: Login with Your New Password

Great! Your password has been reset. Go back to the login page and log in with your new password.

## Managing Your Account Access

### Logout

To logout, click your **profile icon** in the top right corner of the Scoriet dashboard and select **"Logout"**.

<div class="screenshot-placeholder">Screenshot: Profile menu with Logout option — <code>profile-menu-logout.png</code></div>

:::caution **Always Logout on Shared Computers**
If you're using a shared or public computer, always make sure to logout before closing the browser. This prevents others from accessing your account.
:::

### Change Your Password

You can change your password anytime without logging out:

1. Click your **profile icon** → **"Account Settings"**
2. Go to the **"Security"** tab
3. Click **"Change Password"**
4. Enter your current password and your new password (twice)
5. Click **"Update Password"**

<div class="screenshot-placeholder">Screenshot: Account Security settings page — <code>account-security.png</code></div>

### View Active Sessions

To see all active sessions across different devices:

1. Go to **Account Settings** → **"Security"**
2. Scroll to **"Active Sessions"**
3. You'll see a list of devices and locations where you're logged in

<div class="screenshot-placeholder">Screenshot: Active sessions list — <code>active-sessions.png</code></div>

:::tip **Logout Remote Sessions**
If you see an unfamiliar session, click the "X" button to log out that device immediately. This is useful if you think someone else has accessed your account.
:::

## OAuth2 & Token Management

Scoriet uses industry-standard **OAuth2** for authentication. Here's what you should know:

- **No Password Sharing** – Your password is never stored in your browser or on insecure systems
- **Encrypted Tokens** – Access tokens are encrypted and secure
- **Automatic Refresh** – Your session is automatically extended as you work
- **Revokable Access** – You can revoke access anytime in your Account Settings

:::info **What is OAuth2?**
OAuth2 is a secure authentication standard used by Google, Microsoft, GitHub, and other major platforms. It keeps your credentials safe by never sharing them with third parties.
:::

## Troubleshooting Login Issues

**"Invalid email or password"**  
Double-check that you've entered your email and password correctly. Remember, passwords are case-sensitive. If you still can't login, try resetting your password.

**"Account not verified"**  
You haven't verified your email yet. Check your inbox for the verification email from Scoriet, or request a new one from the login page.

**"Too many login attempts"**  
For security, Scoriet temporarily locks accounts after several failed login attempts. Wait 15 minutes and try again, or use the password reset feature.

**"Session expired"**  
Your session has timed out. Simply log in again. This is normal after periods of inactivity.

**"Can't login on mobile"**  
Scoriet is optimized for desktop browsers. While it may work on tablets, mobile phones aren't recommended for the full Scoriet experience due to screen size.

---

:::success **Welcome Back!**
You're now logged in to Scoriet. Ready to create your first project? Head over to the [First Project Walkthrough](./first-project.md) to get started! 🎉
:::
