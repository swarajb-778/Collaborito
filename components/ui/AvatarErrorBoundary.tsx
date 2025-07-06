import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { logger } from '../../src/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  retryText?: string;
  errorMessage?: string;
  testID?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class AvatarErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging
    logger.error('Avatar component error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Haptic feedback for error
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));

      // Haptic feedback for retry
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      logger.info('Avatar error boundary retry attempt', {
        retryCount: this.state.retryCount + 1,
        maxRetries: this.maxRetries,
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.errorContainer} testID={this.props.testID}>
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>Avatar Error</Text>
            <Text style={styles.errorMessage}>
              {this.props.errorMessage || 'Something went wrong with the avatar component.'}
            </Text>
            
            {this.props.showRetry !== false && this.state.retryCount < this.maxRetries && (
              <Pressable
                style={styles.retryButton}
                onPress={this.handleRetry}
                testID={`${this.props.testID}-retry`}
              >
                <Text style={styles.retryButtonText}>
                  {this.props.retryText || 'Try Again'}
                </Text>
              </Pressable>
            )}

            {this.state.retryCount >= this.maxRetries && (
              <Text style={styles.maxRetriesText}>
                Maximum retry attempts reached. Please refresh the app.
              </Text>
            )}

            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>
                  Error: {this.state.error?.message}
                </Text>
                <Text style={styles.debugText}>
                  Retry Count: {this.state.retryCount}/{this.maxRetries}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 300,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  maxRetriesText: {
    fontSize: 12,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  debugContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 10,
    color: '#6c757d',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});

// Higher-order component for easy wrapping
export function withAvatarErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Partial<Props>
) {
  return function WrappedComponent(props: T) {
    return (
      <AvatarErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </AvatarErrorBoundary>
    );
  };
}

export default AvatarErrorBoundary; 