# Supabase Email Rate Limit Solution Guide

## 🚨 Problem: Email Rate Limit Exceeded

The "email rate limit exceeded" error occurs when Supabase's default SMTP configuration hits its sending limits. This commonly happens during development and testing.

## ✅ Comprehensive Solution Implemented

### 1. Robust AuthService with Rate Limit Handling

We've implemented a comprehensive `AuthService` with the following features:

#### **Multiple Fallback Strategies:**
- **Exponential Backoff Retry**: Automatically retries with increasing delays
- **Local Pending Users**: Creates temporary local users when Supabase is rate-limited
- **Client-side Rate Limiting**: Prevents rapid signup attempts (30 seconds between emails)
- **Graceful Error Handling**: User-friendly error messages and recovery

#### **Key Features:**
```typescript
// Rate limit detection
isRateLimitError(error) // Detects rate limit errors
checkRateLimit(email)   // Client-side rate limiting

// Fallback strategies
handleRateLimitedSignup()  // Implements fallback strategies
createPendingUser()        // Creates local pending users
processPendingUsers()      // Background processing of pending users

// Retry mechanisms
retryWithBackoff()         // Exponential backoff retry
```

### 2. Enhanced AuthContext Integration

The `AuthContext` now uses the robust `AuthService` with:
- Automatic session recovery
- Pending user support
- Better error messaging
- Background processing of failed signups

## 🛠️ Supabase Configuration Fixes

### Option 1: Custom SMTP (Recommended for Production)

1. **Navigate to Supabase Dashboard** → Your Project → Authentication → Settings

2. **Enable Custom SMTP:**
   ```
   SMTP Host: smtp.gmail.com (or your provider)
   SMTP Port: 587
   SMTP User: your-email@gmail.com
   SMTP Pass: your-app-password
   SMTP Sender Name: Collaborito
   SMTP Sender Email: noreply@collaborito.com
   ```

3. **Recommended SMTP Providers:**
   - **SendGrid**: 100 emails/day free, reliable
   - **Mailgun**: 5,000 emails/month free
   - **Amazon SES**: Very reliable, pay-as-you-go
   - **Gmail**: Free but limited (use app passwords)

### Option 2: Disable Email Confirmation (Development Only)

1. **In Supabase Dashboard** → Authentication → Settings:
   - Set "Enable email confirmations" to **OFF**
   - This allows immediate signups without email verification

2. **Important**: Only use this for development/testing

### Option 3: Increase Rate Limits (Pro Plans)

1. **Upgrade to Supabase Pro** for higher rate limits
2. **Contact Supabase Support** for custom limits if needed

## 📱 Implementation Usage

### Basic Signup with Rate Limit Handling

```typescript
import { authService } from '@/services/AuthService';

// In your component
const handleSignup = async (email: string, password: string) => {
  try {
    const result = await authService.signUp({
      email,
      password,
      metadata: { username: 'user123' }
    });

    if (result.success) {
      if (result.isPending) {
        // User created locally, will retry automatically
        showMessage('Account created! Email verification may take a few minutes.');
      } else if (result.needsConfirmation) {
        // Normal flow - check email
        showMessage('Please check your email to verify your account.');
      } else {
        // Immediate success
        showMessage('Account created successfully!');
      }
    } else {
      showError(result.error || 'Signup failed');
    }
  } catch (error) {
    showError(error.message);
  }
};
```

### Using Enhanced AuthContext

```typescript
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { signUp, user } = useAuth();

  const handleSignup = async () => {
    try {
      await signUp(email, password, username);
      // Success - user will be automatically updated
    } catch (error) {
      // Error handling already done in AuthContext
      setError(error.message);
    }
  };

  // Check for pending users
  if (user?.isPending) {
    return <PendingVerificationScreen />;
  }

  return <NormalComponent />;
};
```

## 🔧 Production Configuration Checklist

### 1. Supabase Settings

- [ ] **Custom SMTP configured** with reliable provider
- [ ] **Rate limits reviewed** and appropriate for your usage
- [ ] **Email templates customized** with your branding
- [ ] **Redirect URLs configured** for production domains

### 2. Error Monitoring

```typescript
// Add to your app
import { authService } from '@/services/AuthService';

// Monitor pending users
setInterval(() => {
  authService.processPendingUsers();
}, 5 * 60 * 1000); // Every 5 minutes
```

### 3. User Experience

- [ ] **Clear error messages** for rate limits
- [ ] **Progress indicators** during signup
- [ ] **Retry mechanisms** visible to users
- [ ] **Alternative contact methods** if email fails

## 🚀 Advanced Features

### Automatic Background Processing

The service automatically processes pending users:

```typescript
// Runs every 5 minutes in AuthContext
useEffect(() => {
  const interval = setInterval(() => {
    authService.processPendingUsers();
  }, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

### Custom Rate Limit Configuration

```typescript
// Adjust rate limits as needed
const CUSTOM_RETRY_CONFIG = {
  maxRetries: 5,
  baseDelay: 2000,
  maxDelay: 30000,
  backoffMultiplier: 2
};

// Use with service
await authService.signUp({
  email,
  password,
  retryConfig: CUSTOM_RETRY_CONFIG
});
```

### Analytics and Monitoring

```typescript
// Track signup success rates
import { OnboardingAnalytics } from '@/services';

const analytics = OnboardingAnalytics.getInstance();

// Track rate limit incidents
await analytics.trackError(
  userId, 
  'signup', 
  'rate_limit', 
  'Email rate limit exceeded'
);
```

## 🛡️ Security Considerations

### 1. Prevent Abuse

```typescript
// Built-in protections
- Client-side rate limiting (30 seconds per email)
- SQL injection prevention
- Email validation
- State verification for OAuth
```

### 2. Data Protection

```typescript
// Secure pending user storage
- Encrypted data in AsyncStorage
- Automatic cleanup of old pending users
- No sensitive data in logs
```

## 📊 Monitoring and Debugging

### 1. Enable Detailed Logging

```typescript
import { createLogger } from '@/utils/logger';

const logger = createLogger('AuthService');
// Logs all auth operations with emojis for easy scanning
```

### 2. Check Pending Users

```typescript
// Debug pending users
import AsyncStorage from '@react-native-async-storage/async-storage';

const checkPendingUsers = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const pendingKeys = keys.filter(key => key.startsWith('pending_user_'));
  console.log('Pending users:', pendingKeys.length);
};
```

### 3. Monitor Supabase

1. **Supabase Dashboard** → Logs → Authentication
2. Look for `rate_limit_exceeded` errors
3. Check email delivery status

## 🎯 Immediate Action Items

### For You (Supabase Configuration):

1. **Go to your Supabase project dashboard**
2. **Navigate to Authentication → Settings**
3. **Choose one of these options:**

   **Option A (Quick Fix):**
   - Disable "Enable email confirmations" temporarily
   - This allows immediate signups for testing

   **Option B (Production Ready):**
   - Set up custom SMTP with SendGrid/Mailgun
   - Configure proper email templates
   - Test email delivery

4. **Update your `.env` file if needed**

### For Development:

1. **Test the new AuthService:**
   ```bash
   # Run your app and try signing up
   # Check console logs for detailed rate limit handling
   ```

2. **Monitor pending users:**
   ```typescript
   // Add this to a debug screen
   const [pendingCount, setPendingCount] = useState(0);
   
   useEffect(() => {
     const checkPending = async () => {
       const keys = await AsyncStorage.getAllKeys();
       const pending = keys.filter(k => k.startsWith('pending_user_'));
       setPendingCount(pending.length);
     };
     checkPending();
   }, []);
   ```

## 🔄 Next Steps

1. **Test the implementation** with the current rate limit issue
2. **Configure Supabase SMTP** for production
3. **Monitor signup success rates** 
4. **Customize error messages** for your brand
5. **Set up email templates** in Supabase

The implemented solution should handle rate limits gracefully while you configure a permanent fix on the Supabase side. Users will see helpful messages and their signups will be processed automatically once the rate limits reset.

## 📞 Support

If you continue to experience issues:

1. **Check Supabase logs** for specific error details
2. **Test with different email providers** 
3. **Contact Supabase support** for rate limit increases
4. **Use the pending user system** as a temporary workaround

This comprehensive solution ensures your users can always complete signup, even when Supabase has temporary rate limiting issues. 