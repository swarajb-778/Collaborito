# Collaborito Coding Standards

This document outlines the coding standards and best practices for the Collaborito project.

## General Guidelines

- Write clean, readable, and maintainable code
- Follow the principle of DRY (Don't Repeat Yourself)
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility
- Add appropriate comments for complex logic, but prefer self-documenting code

## TypeScript Standards

- Use TypeScript for type safety
- Define interfaces for all data structures
- Avoid using `any` type when possible
- Use type inference when the type is obvious
- Prefer readonly properties for immutable data
- Use union types instead of enums
- Export types at the bottom of the file

```typescript
// Good
interface User {
  readonly id: string;
  name: string;
  email: string;
}

// Avoid
const user: any = { id: '123', name: 'John' };
```

## React & React Native Standards

### Component Structure

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Separate business logic from UI components
- Use the "container/presentational" pattern for complex components

```typescript
// Good component structure
const UserProfile = ({ userId }: { userId: string }) => {
  const { user, loading } = useUser(userId);
  
  if (loading) return <LoadingIndicator />;
  if (!user) return <NotFound message="User not found" />;
  
  return <UserProfileContent user={user} />;
};
```

### Styling

- Use StyleSheet.create for styles
- Group related styles together
- Use theme colors from the theme context
- Consider responsive design for all components
- Use consistent spacing and sizing

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
  },
});
```

## State Management

- Use local component state for UI-only state
- Use React Context for shared state that doesn't change often
- Consider using a state management library for complex state
- Follow immutability principles when updating state

```typescript
// Good state update
setUsers(prevUsers => [...prevUsers, newUser]);

// Avoid
const users = [...];
users.push(newUser); // Mutating state directly
setUsers(users);
```

## File Organization

- Follow the project structure outlined in project-structure.md
- Group related files together
- Keep index files simple (re-export only)
- Use consistent file naming conventions

## Import Order

1. External libraries
2. Internal modules
3. Components
4. Hooks
5. Types
6. Assets

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

- Write tests for critical functionality
- Test components with React Testing Library
- Use appropriate mock data for tests
- Keep tests simple and focused

## Error Handling

- Use try/catch blocks for async operations
- Log errors with appropriate context
- Display user-friendly error messages
- Handle edge cases and null values

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

- Use React.memo for expensive components
- Avoid unnecessary re-renders
- Use useCallback for functions passed as props
- Use useMemo for expensive calculations
- Lazy load components when appropriate

## Accessibility

- Support screen readers with appropriate labels
- Ensure sufficient color contrast
- Support dynamic font sizes
- Make sure all interactive elements are accessible

## Git Workflow

- Write clear, concise commit messages
- Keep commits focused on a single change
- Use pull requests for code reviews
- Keep pull requests small and focused

## Documentation

- Document complex functions and components
- Update README.md when adding new features
- Keep documentation up to date 