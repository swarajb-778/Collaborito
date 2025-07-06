# Collaborito Coding Standards

This document outlines the coding standards and best practices for the Collaborito project. Adhering to these standards ensures code quality, consistency, and maintainability.

## General Guidelines

- Write clean, readable, and maintainable code.
- Follow the principle of DRY (Don't Repeat Yourself).
- Use meaningful variable and function names that clearly describe their purpose.
- Keep functions small and focused on a single responsibility (Single Responsibility Principle).
- Add appropriate comments for complex logic, but prefer self-documenting code. Code should explain *what* it does; comments should explain *why* it does it.

## TypeScript Standards

- Use TypeScript for type safety across the entire codebase.
- Define `interface` or `type` for all data structures. Prefer `interface` for objects and `type` for primitives, unions, and tuples.
- Avoid using the `any` type. Use `unknown` for values where the type is not known at compile time and perform type checking.
- Use type inference when the type is obvious to the TypeScript compiler.
- Prefer `readonly` properties for immutable data to prevent accidental mutations.
- Use union types instead of string enums for a fixed set of values.
- Export types at the bottom of the file for consistency.

```typescript
// Good
interface UserProfile {
  readonly id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
}

// Avoid
const user: any = { id: '123', name: 'John' };
```

## React & React Native Standards

### Component Structure

- Use functional components with hooks
- Keep components small and focused on a single piece of functionality
- Extract reusable logic into custom hooks (e.g., `useApi`, `useForm`)
- Separate business logic from UI components
- Use the "container/presentational" pattern for complex components to separate data fetching from rendering
- **Keys for Lists**: Always use stable and unique keys when rendering lists of components. Avoid using the array index as a key if the list can be reordered

```typescript
// Good component structure
const UserProfile = ({ userId }: { userId: string }) => {
  const { user, loading } = useUser(userId);
  
  if (loading) return <LoadingIndicator />;
  if (!user) return <NotFound message="User not found" />;
  
  return <UserProfileContent user={user} />;
};

// Good list rendering
users.map((user) => <UserListItem key={user.id} user={user} />);

// Avoid
users.map((user, index) => <UserListItem key={index} user={user} />);
```

### Styling

- Use `StyleSheet.create` for all component styles to optimize performance
- Group related styles together within the `StyleSheet` object
- Use theme colors from the theme context to support light/dark mode
- Consider responsive design for all components to ensure a good experience on all screen sizes
- Use consistent spacing, sizing, and typography across the application

```typescript
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
});
```

## State Management

- Use local component state (`useState`) for UI-only state that is not shared
- Use React Context (`useContext`) for shared state that doesn't change often (e.g., theme, user authentication)
- For complex, global state, use a dedicated state management library like Zustand or Redux Toolkit
- Follow immutability principles when updating state. Never mutate state directly

```typescript
// Good state update
setUsers(prevUsers => [...prevUsers, newUser]);

// Avoid
const users = [...];
users.push(newUser); // Mutating state directly
setUsers(users);
```

## File Organization

- Follow the project structure outlined in `docs/project-structure.md`
- Group related files together by feature (e.g., `src/features/authentication/`)
- Keep `index.ts` files simple. Their only purpose should be to re-export modules from their directory
- Use consistent file naming conventions (e.g., `ComponentName.tsx`, `useCustomHook.ts`)

## Import Order

1. React and React Native imports
2. External libraries (e.g., `lodash`, `date-fns`)
3. Internal modules (services, utils, config)
4. Components (UI, navigation, screens)
5. Hooks
6. Types
7. Assets (images, fonts)

```typescript
// External libraries
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Internal modules
import { createLogger } from 'src/utils/logger';
import { API_BASE_URL } from 'src/constants/AppConfig';

// Components
import { Button } from 'src/components/ui';

// Hooks
import { useAuth } from 'src/hooks';

// Types
import type { User } from 'src/types';

// Assets
import { icons } from 'src/assets';
```

## Testing

- Write tests for all critical functionality and business logic
- Use **React Testing Library** for component testing. Focus on testing component behavior from a user's perspective
- **Unit Tests**: Test individual functions and utilities in isolation
- **Integration Tests**: Test how multiple components work together
- **End-to-End (E2E) Tests**: Use a framework like Detox or Maestro to test user flows across the entire application
- Use appropriate mock data for tests and mock API calls to ensure tests are fast and reliable
- Keep tests simple, focused, and easy to read

## Error Handling

- Use `try/catch` blocks for all asynchronous operations that can fail (e.g., API calls)
- Log errors with a structured logging service, providing appropriate context
- Display user-friendly error messages. Avoid showing technical error details to the user
- Handle edge cases and null/undefined values gracefully

```typescript
try {
  const data = await fetchData();
  setData(data);
} catch (error) {
  logger.error('Failed to fetch data', error);
  setError('Unable to load data. Please try again later.');
}
```

## Performance Considerations

- Use `React.memo` to memoize expensive components and prevent unnecessary re-renders
- Use `useCallback` to memoize functions that are passed as props to child components
- Use `useMemo` for expensive calculations to avoid re-computing them on every render
- Use `FlatList` or `SectionList` for long lists of data to leverage virtualization
- Lazy load components and screens when appropriate using `React.lazy`

## Accessibility (a11y)

- Support screen readers by providing `accessibilityLabel` and `accessibilityHint` props for all interactive elements
- Ensure sufficient color contrast between text and background to meet WCAG guidelines
- Support dynamic font sizes to respect the user's device settings
- Make sure all interactive elements are large enough to be easily tapped

## Git Workflow

- Write clear, concise, and descriptive commit messages
- Follow the **Conventional Commits** specification for commit messages. This helps automate changelog generation and versioning
  - `feat`: A new feature
  - `fix`: A bug fix
  - `docs`: Documentation only changes
  - `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
  - `refactor`: A code change that neither fixes a bug nor adds a feature
  - `perf`: A code change that improves performance
  - `test`: Adding missing tests or correcting existing tests
  - `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation
- Keep commits focused on a single logical change
- Use pull requests (PRs) for all code changes to the `main` branch
- Keep pull requests small and focused on a single feature or bug fix

## Code Reviews

- All pull requests must be reviewed by at least one other team member before merging
- Reviewers should provide constructive feedback and suggestions
- The PR author is responsible for addressing all feedback before merging
- Be respectful and professional in all code review comments. The goal is to improve the code, not to criticize the author

## Documentation

- Document complex functions, components, and hooks, explaining their purpose, props, and usage
- Update the project `README.md` when adding new features or changing the project setup
- Keep all documentation in the `docs` directory up to date with the latest changes
- Write documentation in Markdown 