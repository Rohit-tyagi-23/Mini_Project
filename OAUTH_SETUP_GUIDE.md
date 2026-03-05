# OAuth Setup Guide

Your Restaurant Inventory AI application now has Google, Microsoft, and Apple OAuth login enabled! Follow these steps to configure each provider.

## Overview

OAuth allows users to log in using their existing accounts from Google, Microsoft, or Apple. This is now fully integrated with your PostgreSQL database.

---

## 1. Google OAuth Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown and select "New Project"
3. Enter a project name (e.g., "Restaurant Inventory AI")
4. Click "Create"

### Step 2: Enable Google+ API
1. In the sidebar, click **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

### Step 3: Create OAuth Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application**
4. Under "Authorized redirect URIs", add:
   ```
   http://localhost:5000/auth/callback/google
   ```
   (For production, use: `https://yourdomain.com/auth/callback/google`)
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

### Step 4: Update .env File
Open `.env` and update:
```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

---

## 2. Microsoft OAuth Setup

### Step 1: Register Application
1. Go to [Azure Portal](https://portal.azure.com/)
2. Search for "App registrations" and click it
3. Click **New registration**
4. Enter application name (e.g., "Restaurant Inventory AI")
5. Under "Supported account types", select **Accounts in any organizational directory and personal Microsoft accounts**
6. Click **Register**

### Step 2: Add Credentials
1. In the left sidebar, click **Certificates & secrets**
2. Click **New client secret**
3. Add a description and set expiration
4. Click **Add**
5. Copy the **Value** (this is your client secret)

### Step 3: Add Redirect URI
1. Click **Authentication** in the left sidebar
2. Under "Web", click **Add URI**
3. Add:
   ```
   http://localhost:5000/auth/callback/microsoft
   ```
4. Click **Save**

### Step 4: Get Client ID
1. Click **Overview** in the left sidebar
2. Copy the **Application (client) ID**

### Step 5: Update .env File
Open `.env` and update:
```env
MICROSOFT_CLIENT_ID=your-client-id-here
MICROSOFT_CLIENT_SECRET=your-client-secret-here
```

---

## 3. Apple OAuth Setup

### Step 1: Enroll in Apple Developer Program
1. Go to [Apple Developer Program](https://developer.apple.com/programs/)
2. Enroll if you haven't already (requires Apple ID and membership fee)

### Step 2: Create Service ID
1. Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources)
2. Click **Identifiers**
3. Select **Services IDs** from the dropdown
4. Click the **+** icon
5. Enter a description and identifier (e.g., `com.restaurantai.web`)
6. Click **Continue** and then **Register**

### Step 3: Configure Web Authentication
1. Select the Service ID you just created
2. Check **Sign in with Apple**
3. Click **Configure**
4. Under "Return URLs", add:
   ```
   http://localhost:5000/auth/callback/apple
   ```
5. Click **Save**

### Step 4: Create Private Key
1. Go to **Keys** in the left sidebar
2. Click the **+** icon
3. Enter a key name
4. Check **Sign in with Apple**
5. Click **Configure**
6. Select the Service ID you created
7. Click **Save**
8. Click **Continue** and **Register**
9. Download the private key (store it safely)

### Step 5: Update .env File
Open `.env` and update:
```env
APPLE_CLIENT_ID=your-service-id-here
APPLE_CLIENT_SECRET=your-team-id-and-key-id
```

**Note**: Apple OAuth is more complex. You'll need to create a JWT token using your Team ID, Key ID, and private key. For detailed implementation, see Apple's [official documentation](https://developer.apple.com/documentation/sign_in_with_apple).

---

## 4. Testing the OAuth Logins

### Local Testing
1. Make sure your `.env` file has all the credentials filled in
2. Start the Flask application
3. Go to `http://localhost:5000/login`
4. Click on the Google, Microsoft, or Apple button
5. You should be redirected to the provider's login page
6. After successful authentication, you'll be logged in and redirected to the dashboard

### Troubleshooting

**Error: "OAuth not configured yet"**
- Make sure your `.env` file has the correct client IDs and secrets
- Restart the Flask application after updating `.env`

**Error: "Failed to get user information"**
- Check that the credentials are correct
- Make sure the redirect URI in your OAuth provider matches exactly: `http://localhost:5000/auth/callback/{provider}`

**Users are not being created**
- Check the database connection is working
- Make sure the PostgreSQL database is accessible

---

## 5. Production Deployment

When deploying to production:

1. **Update Redirect URIs**:
   - Change all `http://localhost:5000` to your production domain
   - Example: `https://restaurant-ai.yourcompany.com/auth/callback/google`

2. **Update .env**:
   - Use production credentials from each OAuth provider
   - Set `DEBUG=False` in .env

3. **HTTPS Required**:
   - All OAuth providers require HTTPS in production
   - Set up SSL/TLS certificates on your server

4. **Environment Variables**:
   - Use your server's environment variable management system
   - Keep secrets secure (never commit .env to version control)

---

## 6. Features Enabled

✅ **Google Login** - Login with Google accounts  
✅ **Microsoft Login** - Login with Microsoft/Office 365 accounts  
✅ **Apple Login** - Login with Apple ID  
✅ **Auto User Registration** - New users are automatically created in the database  
✅ **User Profile Sync** - Email, first name, and last name are synced from OAuth provider  
✅ **Database Integration** - All OAuth logins are connected to the PostgreSQL database  

---

## 7. Security Notes

- **Never commit `.env` to version control** - Add it to `.gitignore`
- **Use HTTPS in production** - OAuth tokens should always be transmitted over HTTPS
- **Store private keys securely** - Keep Apple's private key in a secure location
- **Regularly rotate credentials** - Generate new client secrets periodically
- **Monitor OAuth usage** - Check your OAuth provider's console for suspicious activity

---

## 8. Support

For additional help:
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft OAuth Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Apple Sign in with Apple Documentation](https://developer.apple.com/sign-in-with-apple/get-started/)
