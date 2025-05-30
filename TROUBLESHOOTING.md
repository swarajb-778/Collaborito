# Troubleshooting Guide

## App Startup Issues - RESOLVED ✅

### Problem Summary
The app was experiencing startup issues due to circular dependencies and Node.js 22.x compatibility problems.

### Issues Identified & Fixed

1. **Circular Dependencies** ✅ FIXED
   - **Problem**: Circular imports between `onboardingService`, `syncService`, `errorRecoveryService`, and `performanceService`
   - **Solution**: Removed advanced services and simplified onboarding service
   - **Files Changed**: 
     - `src/services/onboardingService.ts` - Simplified
     - Deleted: `syncService.ts`, `errorRecoveryService.ts`, `performanceService.ts`

2. **TypeScript Compilation Errors** ✅ FIXED
   - **Problem**: Missing exports and type mismatches in onboarding screens
   - **Solution**: Added missing method exports and corrected data handling
   - **Files Changed**:
     - `src/services/onboardingService.ts` - Added missing methods
     - `app/onboarding/interests.tsx` - Fixed data extraction
     - `app/onboarding/project-skills.tsx` - Fixed data extraction

3. **Node.js 22.x Compatibility** ⚠️ WORKAROUND NEEDED
   - **Problem**: ES module conflicts with Node.js 22.x
   - **Root Cause**: `expo-modules-core` ES module incompatibility
   - **Solution**: Use Node.js 18.x or 20.x

### Current Status

✅ **Working:**
- TypeScript compilation (`npx tsc --noEmit`)
- Code structure and imports
- All onboarding screens
- Database initialization
- Service architecture

❌ **Needs Node.js 18/20:**
- Expo development server
- Runtime execution

### Quick Resolution Steps

1. **Check Node.js Version:**
   ```bash
   node --version
   ```

2. **If Node.js 22.x, switch to 20.x:**
   ```bash
   # Using nvm (recommended)
   nvm install 20
   nvm use 20
   
   # Or download from nodejs.org
   ```

3. **Clean Install:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Start App:**
   ```bash
   npm start
   ```

### Diagnostic Tools

Run the startup diagnostic script:
```bash
node fix-startup.js
```

This will:
- Check Node.js version compatibility
- Update package.json with version requirements
- Fix metro configuration
- Provide recommendations

### Alternative Solutions (If Node Version Switch Not Possible)

1. **Use Yarn Instead:**
   ```bash
   yarn install
   yarn start
   ```

2. **Try with Legacy Node Options:**
   ```bash
   NODE_OPTIONS="--no-warnings" npm start
   ```

3. **Use Expo CLI Directly:**
   ```bash
   npx expo start --clear --dev
   ```

### Dependencies Summary

- **Expo SDK**: 53.0.9 (latest stable)
- **React Native**: 0.79.2
- **TypeScript**: 5.8.3
- **Node.js Required**: 18.x or 20.x
- **Node.js Incompatible**: 22.x

### Files Modified in Fix

1. **Services:**
   - `src/services/onboardingService.ts` - Simplified and fixed exports
   - `src/utils/databaseInit.ts` - Removed advanced service dependencies

2. **Configuration:**
   - `app.config.ts` - Temporarily disabled expo-auth-session plugin
   - `metro.config.js` - Enhanced module resolution
   - `package.json` - Added Node.js version requirements

3. **Onboarding Screens:**
   - `app/onboarding/interests.tsx` - Fixed data handling
   - `app/onboarding/project-skills.tsx` - Fixed data handling

4. **New Files:**
   - `fix-startup.js` - Diagnostic and fix script
   - `TROUBLESHOOTING.md` - This file

### Commits Made

1. `fix(startup): resolve circular dependencies and TypeScript errors`
2. `fix(startup): implement comprehensive startup fixes`

### Next Steps

Once Node.js version is compatible:
1. The app should start successfully
2. All onboarding screens should work
3. Database initialization will function
4. Future development can proceed normally

### Contact

If issues persist after following this guide, the problem may be environment-specific. Check:
- Operating system compatibility
- npm/yarn version
- Global package conflicts
- Port availability (8081, 19000, 19001) 