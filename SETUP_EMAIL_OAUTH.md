# Setup Guide: Email & Google OAuth

This guide explains how to configure Gmail SMTP and Google OAuth for the English Learning Platform.

---

## 1. Gmail SMTP Setup (For Email Verification & Password Reset)

### Prerequisites
- A Gmail account with 2-Factor Authentication enabled
- Gmail App Password (16-character code)

### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click on **2-Step Verification**
3. Follow the prompts to enable 2FA

### Step 2: Generate App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click on **App passwords** (under "2-Step Verification")
3. Select app: **Mail**
4. Select device: **Other (Custom name)** and enter "English Learning Platform"
5. Click **Generate**
6. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

### Step 3: Configure Backend

Edit your `.env.development` or `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM_ADDRESS=noreply@englishlearning.com
EMAIL_FROM_NAME=English Learning Platform
FRONTEND_URL=http://localhost:3681
```

### Step 4: Test Email

After configuring, test by:
1. Registering a new account
2. Checking for verification email
3. Using "Forgot Password" feature

---

## 2. Google OAuth Setup (For Google Login)

### Prerequisites
- A Google Cloud project
- Access to Google Cloud Console

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** at the top
3. Click **New Project**
4. Enter project name: `English Learning Platform`
5. Click **Create**

### Step 2: Enable Google+ API

1. In the Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "Google Identity Services"
3. Click on the API
4. Click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** and click **Create**
3. Fill in the required fields:
   - App name: `English Learning Platform`
   - User support email: your email
   - Developer contact: your email
4. Click **Save and Continue**
5. On Scopes page, click **Add or Remove Scopes**
6. Select:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
7. Click **Save and Continue**
8. Add test users (your Google email for testing)
9. Click **Save and Continue**

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Application type: **Web application**
4. Name: `English Learning Platform Web Client`
5. Authorized JavaScript origins:
   - `http://localhost:3681` (development)
   - `https://your-domain.com` (production)
6. Authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://your-domain.com/auth/google/callback` (production)
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

### Step 5: Configure Backend

Edit your `.env.development` or `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### Step 6: Install Google OAuth Package

```bash
cd backend
npm install passport @nestjs/passport passport-google-oauth20
npm install -D @types/passport-google-oauth20
```

### Step 7: Restart Backend

```bash
npm run start:dev
```

---

## 3. Testing the Features

### Test Email Verification

1. Register a new account
2. Check email for verification link
3. Click the link
4. Verify you're redirected to success page

### Test Password Reset

1. Click "Forgot password?" on login page
2. Enter your email
3. Check email for new password
4. Login with the new password

### Test Google OAuth

1. Click "Sign in with Google" on login page
2. Authorize the application
3. Verify you're logged in with Google account

---

## 4. Troubleshooting

### Gmail Authentication Errors

**Error:** `535-5.7.8 Username and Password not accepted`

**Solution:**
- Verify 2FA is enabled
- Use App Password (not your regular password)
- Check `SMTP_SECURE=false` for port 587

### Google OAuth Redirect Error

**Error:** `redirect_uri_mismatch`

**Solution:**
- Verify redirect URI matches exactly in Google Cloud Console
- Include protocol (http/https)
- Include port number for localhost

### Email Not Sending

**Solution:**
1. Check backend logs for errors
2. Verify SMTP credentials
3. Check spam folder
4. Test with different email provider if issues persist

---

## 5. Production Deployment Notes

### Email in Production

For production, consider using:
- **SendGrid**: Better deliverability, free tier 100 emails/day
- **AWS SES**: Cost-effective, $0.10 per 1000 emails
- **Resend**: Modern API, free tier 3000 emails/month

### Google OAuth in Production

1. Submit your app for Google verification (may take weeks)
2. Or use internal/test users only
3. Update redirect URIs for production domain
4. Keep credentials secure (use environment variables)

---

## 6. Security Best Practices

1. **Never commit credentials to git**
   - Use `.gitignore` for `.env` files
   - Use secrets management in production

2. **Rotate credentials regularly**
   - Change App Passwords periodically
   - Rotate OAuth secrets

3. **Use HTTPS in production**
   - Redirect URIs must use HTTPS
   - Enable secure cookies

4. **Rate limiting**
   - The backend already has throttling enabled
   - Adjust limits in `.env` if needed
