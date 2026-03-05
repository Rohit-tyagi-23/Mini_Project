# OAuth Login - Quick Start Checklist

## ✅ Installation Complete

Your Restaurant Inventory AI now has Google, Microsoft, and Apple OAuth login enabled and integrated with your PostgreSQL database.

## 📋 What You Need to Do

### 1. Get OAuth Credentials (5-10 minutes per provider)

Choose which providers you want to enable:

**☐ Google OAuth**
- Visit: https://console.cloud.google.com/
- Create a new project → Enable Google+ API → Create OAuth credentials
- Copy Client ID and Client Secret
- Add redirect URI: `http://localhost:5000/auth/callback/google`

**☐ Microsoft OAuth**
- Visit: https://portal.azure.com/
- Register new app → Add credentials → Generate client secret
- Copy Client ID and Client Secret  
- Add redirect URI: `http://localhost:5000/auth/callback/microsoft`

**☐ Apple OAuth**
- Visit: https://developer.apple.com/account/resources
- Create Service ID → Configure Sign in with Apple
- Add redirect URI: `http://localhost:5000/auth/callback/apple`
- Create private key and download

### 2. Configure Environment Variables

Edit your `.env` file and add your credentials:

```env
# Google OAuth
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# Microsoft OAuth  
MICROSOFT_CLIENT_ID=YOUR_MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET=YOUR_MICROSOFT_CLIENT_SECRET

# Apple OAuth
APPLE_CLIENT_ID=YOUR_APPLE_CLIENT_ID
APPLE_CLIENT_SECRET=YOUR_APPLE_CLIENT_SECRET
```

### 3. Restart the Flask Application

Stop and restart your Flask app:
```bash
# Press Ctrl+C to stop current app
python app.py
```

### 4. Test OAuth Login

1. Open: http://localhost:5000/login
2. Look for the Google, Microsoft, and Apple buttons below the login form
3. Click on one to test
4. You should be redirected to that provider's login page
5. After login, you'll be redirected to your dashboard
6. Your account will be automatically created in the database

## 🎯 What Happens When User Logs In

1. User clicks Google/Microsoft/Apple button
2. Redirect to provider's login page
3. Provider redirects back with authorization code
4. App exchanges code for access token
5. App fetches user info (email, name)
6. App creates new user in PostgreSQL database (if first time)
7. User is logged in and sees dashboard
8. Next login, user is found in database and logged in

## 📊 Database Integration

- User table: `user` - Contains all OAuth and regular users
- Location table: `location` - Default location created for new OAuth users
- All user data synced from OAuth providers automatically

## 🔒 Security

- Credentials loaded from `.env` - Never hardcoded
- HTTPS required in production
- Proper OAuth 2.0 code flow implemented
- User tokens not stored - Authentication via provider each time
- Password field empty for OAuth users - Prevents password-based login

## ❓ Frequently Asked Questions

**Q: Can users login with both password AND OAuth?**
A: Yes! If they create a password account, they can also use OAuth with the same email.

**Q: What if OAuth provider login fails?**
A: User gets back to login page with an error message. They can try again or use password login.

**Q: Where are OAuth tokens stored?**
A: Tokens are NOT stored. We only store the authorization code briefly, then delete it. User info (email, name) is saved in the database.

**Q: How do I remove OAuth for one provider?**
A: Just don't fill in the `.env` variables for that provider. Leave them as "your-provider-id-here".

**Q: What happens if I need to re-authenticate?**
A: Users will login fresh with OAuth provider each time. No refresh tokens used.

## 📝 Configuration Files Changed

- `.env` - Added OAuth credentials  
- `app.py` - Updated OAuth routes with proper token exchange
- `requirements.txt` - Added `requests` and `PyJWT` packages
- `OAUTH_SETUP_GUIDE.md` - Detailed setup instructions (NEW)
- `OAUTH_IMPLEMENTATION_SUMMARY.md` - Technical summary (NEW)

## 🚀 Next Steps

1. Follow the detailed guide: `OAUTH_SETUP_GUIDE.md`
2. Get credentials from Google, Microsoft, and/or Apple
3. Add credentials to `.env`
4. Restart Flask app
5. Test by clicking OAuth buttons on login page
6. Users will be created in your PostgreSQL database automatically

## 📞 Troubleshooting

**Not seeing OAuth buttons on login page?**
- Make sure you're accessing: http://localhost:5000/login
- Buttons should appear below the "or continue with" text

**"OAuth not configured yet" error?**
- You haven't added OAuth credentials to `.env` yet
- Or your `.env` values still contain "your-" placeholder text

**Can't login even with valid credentials?**
- Check `.env` has correct credentials
- Restart Flask app after updating `.env`
- Make sure redirect URI matches exactly
- Check browser console for errors

**User not created in database?**
- Make sure PostgreSQL is running
- Check Flask logs for database errors
- Verify DATABASE_URL in `.env` is correct

---

**Ready to get started?** See `OAUTH_SETUP_GUIDE.md` for step-by-step instructions.
