import { router } from 'expo-router';

/**
 * Safe navigation utility with error handling
 */
export class SafeNavigation {
  /**
   * Navigate to a route with error handling
   */
  static push(href: string): void {
    try {
      router.push(href as any);
    } catch (error) {
      console.error('Navigation error (push):', error);
      this.fallbackNavigation(href);
    }
  }

  /**
   * Replace current route with error handling
   */
  static replace(href: string): void {
    try {
      router.replace(href as any);
    } catch (error) {
      console.error('Navigation error (replace):', error);
      this.fallbackNavigation(href);
    }
  }

  /**
   * Go back with error handling
   */
  static back(): void {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        // If can't go back, navigate to a safe default
        this.replace('/welcome');
      }
    } catch (error) {
      console.error('Navigation error (back):', error);
      // Fallback to home if back fails
      this.replace('/welcome');
    }
  }

  /**
   * Dismiss modal with error handling
   */
  static dismiss(count?: number): void {
    try {
      router.dismiss(count);
    } catch (error) {
      console.error('Navigation error (dismiss):', error);
      // Fallback to back navigation
      this.back();
    }
  }

  /**
   * Check if navigation can go back safely
   */
  static canGoBack(): boolean {
    try {
      return router.canGoBack();
    } catch (error) {
      console.error('Navigation error (canGoBack):', error);
      return false;
    }
  }

  /**
   * Fallback navigation when primary method fails
   */
  private static fallbackNavigation(href: string): void {
    try {
      // Try alternative navigation method
      if (href.startsWith('/')) {
        // For absolute paths, try basic replace
        window.location.hash = href;
      }
    } catch (fallbackError) {
      console.error('Fallback navigation also failed:', fallbackError);
    }
  }

  /**
   * Navigate with validation and error handling
   */
  static safeNavigate(href: string, method: 'push' | 'replace' = 'push'): boolean {
    try {
      // Validate the href
      if (!this.isValidHref(href)) {
        console.warn('Invalid navigation href:', href);
        return false;
      }

      // Execute navigation
      if (method === 'push') {
        this.push(href);
      } else {
        this.replace(href);
      }

      return true;
    } catch (error) {
      console.error('Safe navigation failed:', error);
      return false;
    }
  }

  /**
   * Validate navigation href
   */
  private static isValidHref(href: string): boolean {
    if (!href || typeof href !== 'string') {
      return false;
    }

    // Check for common invalid patterns
    if (href.includes('undefined') || href.includes('null')) {
      return false;
    }

    // Must start with / for relative paths or be a valid scheme
    return href.startsWith('/') || Boolean(href.match(/^[a-z][a-z0-9+.-]*:/));
  }

  /**
   * Navigate to a fallback route if current route is invalid
   */
  static navigateToFallback(): void {
    try {
      this.replace('/welcome');
    } catch (error) {
      console.error('Even fallback navigation failed:', error);
    }
  }
} 