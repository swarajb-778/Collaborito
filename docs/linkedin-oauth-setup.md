# LinkedIn OAuth Setup for Collaborito

This guide will walk you through setting up LinkedIn OAuth for the Collaborito app.

## Prerequisites
- LinkedIn account
- Access to the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)

## Step 1: Create a LinkedIn Developer App

1. Go to the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Sign in with your LinkedIn account
3. Click "Create app" button
4. Fill in the required information:
   - **App name**: Collaborito
   - **LinkedIn Page**: Your company page or personal profile URL
   - **App logo**: Upload the Collaborito logo
   - **Legal Agreement**: Accept the terms
5. Click "Create app"

## Step 2: Configure Auth Settings

1. In your new app dashboard, go to the "Auth" tab
2. Under "OAuth 2.0 settings", add the following Authorized Redirect URLs:
   - `https://ekydublgvsoaaepdhtzc.supabase.co/auth/v1/callback`
3. Under "OAuth 2.0 scopes", select:
   - `r_liteprofile`
   - `r_emailaddress`
4. Save changes

## Step 3: Get Client ID and Secret

1. In the "Auth" tab, note down your:
   - **Client ID**
   - **Client Secret**

## Step 4: Update Supabase Auth Settings

1. Go to your [Supabase Dashboard](https://app.supabase.io/)
2. Select your project (ekydublgvsoaaepdhtzc)
3. Go to "Authentication" → "Providers"
4. Find "LinkedIn" in the list of providers and enable it
5. Enter your Client ID and Client Secret
6. Save changes

## Step 5: Update Environment Variables

Update your `.env` file with the following values:

```
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=collaborito://auth/callback
```

## Testing the Integration

1. Restart your Expo dev server
2. Open the app and tap "Sign in with LinkedIn"
3. You should be redirected to LinkedIn to authorize the app
4. After authorization, you should be redirected back to the app and signed in

## Troubleshooting

### Redirect URI Issues
- Make sure the redirect URI in Supabase matches exactly what's in your LinkedIn app settings
- For development on physical devices, ensure the deep linking is properly configured

### Authentication Failures
- Check your Client ID and Secret
- Verify that your Supabase project has the LinkedIn provider enabled
- Make sure your app's authorized scopes include `r_liteprofile` and `r_emailaddress`

### Deep Linking Problems
- Confirm the scheme in `app.config.js` matches what you're using in your redirect URI
- Test deep links using `npx uri-scheme open collaborito://auth/callback --android` or `--ios` 