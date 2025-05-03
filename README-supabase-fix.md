# Supabase Issue Fix Checker

## Background

This project uses Expo SDK 53 and Supabase, which currently have a compatibility issue related to the `stream` module. 

The issue occurs because React Native 0.79 (included in Expo SDK 53) enables package exports resolution by default, which causes problems with the WebSocket implementation used by Supabase.

## Current Workaround

We're currently using a workaround in `metro.config.js`:

```js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package exports to fix Supabase/ws issue
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
```

## Automated Fix Checker

To monitor when this issue is fixed in Supabase, we've created an automated checker that:

1. Checks for new Supabase versions every 2 days
2. Tests if the app can run without the workaround
3. Provides notifications when the issue is resolved

### Usage

This check runs automatically when you:

- Run `npm run setup` at the start of your work session
- Or manually run `npm run check-supabase-fix`

If you want to force a check regardless of the 2-day interval:

```bash
node check-supabase-fix.js --force
```

### How It Works

The script:

1. Checks if a new version of Supabase is available
2. Creates a backup of metro.config.js
3. Creates a test version of metro.config.js without the workaround
4. Tries to start the app without the workaround
5. Checks for the stream module error
6. Restores the backup if the issue still exists
7. Updates every 2 days

### Relevant GitHub Issues

- [Supabase Issue #1400](https://github.com/supabase/supabase-js/issues/1400)
- [Expo Issue #36477](https://github.com/expo/expo/issues/36477)

## When Fixed

Once fixed:
1. You can remove the workaround from metro.config.js
2. Delete the .supabase-check-data.json file to reset the checker
3. Remove the setup scripts if no longer needed 