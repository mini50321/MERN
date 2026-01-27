# Google OAuth Setup Guide

## Step-by-Step Instructions

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com
2. Sign in with your Google account (or the client's Google account)

### Step 2: Create a New Project

1. Click the project dropdown at the top
2. Click "New Project"
3. Enter project name: "Mavy Platform" (or any name)
4. Click "Create"
5. Wait for the project to be created, then select it

### Step 3: Enable Google+ API

1. Go to "APIs & Services" > "Library" (in the left menu)
2. Search for "Google+ API" or "Google Identity"
3. Click on it and click "Enable"

### Step 4: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required information:
   - **App name**: Mavy Platform (or your app name)
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click "Save and Continue"
6. On "Scopes" page, click "Add or Remove Scopes"
   - Add: `email`, `profile`, `openid`
   - Click "Update" then "Save and Continue"
7. On "Test users" (if in testing), add test emails if needed
8. Click "Save and Continue" then "Back to Dashboard"

### Step 5: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Fill in:
   - **Name**: Mavy Platform Web Client (or any name)
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173` (for development)
     - `https://yourdomain.com` (for production - add this later)
   - **Authorized redirect URIs**:
     - `http://localhost:5173/auth/callback` (for development)
     - `https://yourdomain.com/auth/callback` (for production - add this later)
5. Click "Create"
6. **IMPORTANT**: Copy your **Client ID** and **Client Secret**
   - You'll see a popup with these values
   - Save them securely - you won't see the secret again!

### Step 6: Add Credentials to Backend .env

1. Create or edit `backend/.env` file
2. Add these lines:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
CORS_ORIGIN=http://localhost:5173
```

3. Replace `your_client_id_here` and `your_client_secret_here` with the values from Step 5

### Step 7: Restart Backend Server

```bash
cd backend
npm run dev
```

### Step 8: Test Gmail Login

1. Go to your frontend: http://localhost:5173
2. Click "Start Free" or go to login page
3. Click "Continue with Gmail"
4. You should be redirected to Google login
5. After logging in, you'll be redirected back to your app

## Important Notes

- **Development vs Production**: 
  - For development, use `http://localhost:5173`
  - For production, add your production domain to Google Cloud Console

- **Security**: 
  - Never commit `.env` files to Git
  - Keep your Client Secret secure
  - Don't share credentials publicly

- **Testing**: 
  - If your app is in "Testing" mode, only test users can log in
  - To make it public, you need to submit for verification (for production)

## Troubleshooting

**Error: "redirect_uri_mismatch"**
- Check that the redirect URI in Google Console matches exactly: `http://localhost:5173/auth/callback`
- Make sure there are no trailing slashes or typos

**Error: "invalid_client"**
- Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct in your .env file
- Make sure you restarted the backend after adding them

**Error: "access_denied"**
- User might have denied permission
- Check OAuth consent screen is configured correctly

## Production Setup

When deploying to production:

1. Add your production domain to Google Cloud Console:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com/auth/callback`

2. Update `backend/.env`:
   ```env
   CORS_ORIGIN=https://yourdomain.com
   ```

3. Make sure your production backend has the same GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

