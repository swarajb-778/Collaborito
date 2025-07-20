# Collaborito Project Structure

This document outlines the improved project structure for better organization and maintainability.

## Root Directory
- `.github/` - CI/CD workflows and GitHub configurations
- `app/` - Expo Router app directory (screens and navigation)
- `assets/` - Static assets like images, fonts, etc.
- `docs/` - Project documentation
- `src/` - Main source code directory
- `supabase/` - Supabase configurations
- `proxy-server/` - LinkedIn OAuth proxy server

## Source Code Structure (`src/`)
- `__tests__/` - Test files
- `components/` - UI components organized by type
  - `common/` - Reusable UI elements like text, links, etc.
  - `layout/` - Layout components like containers, scrollviews
  - `ui/` - Complex UI components like buttons, inputs
- `constants/` - Application constants
- `contexts/` - React contexts for state management
- `hooks/` - Custom React hooks
- `navigation/` - Navigation utilities
- `screens/` - Screen components (if not using Expo Router)
- `services/` - API services and external integrations
- `types/` - TypeScript type definitions
- `utils/` - Utility functions

## App Directory (`app/`)
- `(tabs)/` - Tab-based navigation screens
- `projects/` - Project-related screens
- `_layout.tsx` - Root layout component
- `login.tsx`, `register.tsx` - Authentication screens

## Documentation (`docs/`)
- `requirements/` - Project requirements
- `screenshots/` - UI screenshots
- `project-structure.md` - This document

## Benefits of This Structure

1. **Separation of Concerns** - Clear organization by functionality
2. **Scalability** - Easy to add new features without cluttering
3. **Maintainability** - Easier to find and modify files
4. **Reusability** - Components organized for better reuse
5. **Testing** - Clear structure for test organization

## Recent Structural Improvements

- **Enhanced Documentation**: Added comprehensive documentation structure
- **Service Layer**: Implemented organized service architecture
- **Type Safety**: Improved TypeScript integration throughout
- **Performance**: Optimized file organization for better build times 