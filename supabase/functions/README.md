# Supabase Edge Functions

This directory contains Supabase Edge Functions that run in a Deno environment.

## TypeScript Configuration

The Edge Functions use `@ts-ignore` comments to suppress TypeScript linting errors that occur in local development. This is necessary because:

1. **Deno Environment**: Edge Functions run in Deno, not Node.js
2. **URL Imports**: Deno supports importing directly from URLs (like `https://deno.land/std/...`)
3. **Global APIs**: Deno provides different globals than the browser/Node.js environment

## Why @ts-ignore?

The TypeScript errors you see locally (like "Cannot find module 'https://deno.land/...'") are **false positives**. These imports work perfectly in the Supabase Edge Functions runtime.

Using `@ts-ignore` is the **recommended approach** by Supabase for Edge Functions because:

- ✅ **No Conflicts**: Doesn't interfere with your main project's TypeScript configuration
- ✅ **Minimal**: Targeted solution that only affects problematic lines
- ✅ **Clear**: Makes it obvious why certain lines are ignored
- ✅ **Production Ready**: Functions work perfectly when deployed

## Available Functions

- `onboarding-handler/` - Handles onboarding flow steps
- `onboarding-status/` - Tracks onboarding completion status  
- `update-onboarding-step/` - Updates user onboarding progress
- `claude-ai/` - AI assistant integration
- `check-auth-user-exists/` - User authentication verification

## Development

When developing Edge Functions:

1. **Local Testing**: Use `supabase functions serve <function-name>`
2. **Deployment**: Use `supabase functions deploy <function-name>`
3. **Logs**: Use `supabase functions logs <function-name>`

## TypeScript Notes

- Import statements use URLs for Deno standard library
- ESM imports from `https://esm.sh/` for NPM packages
- Environment variables accessed via `Deno.env.get()`
- All of these work in production despite local linting warnings 