import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createLogger } from '../../src/utils/logger';
import { useRouter } from 'expo-router';

const logger = createLogger('OnboardingErrorBoundary');

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

class OnboardingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: `error_${Date.now()}`
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorDetails = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
    };

    logger.error('Onboarding error boundary caught error:', errorDetails);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Track error for analytics if needed
    // analytics.trackError('onboarding_error', errorDetails);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: `error_${Date.now()}`
    });
  };

  handleRestart = () => {
    this.resetError();
    // Could navigate to start of onboarding or previous safe state
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.resetError);
      }

      return (
        <ErrorFallback
          error={this.state.error!}
          errorId={this.state.errorId}
          onRestart={this.handleRestart}
          onReset={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
function ErrorFallback({ 
  error, 
  errorId, 
  onRestart, 
  onReset 
}: { 
  error: Error; 
  errorId: string; 
  onRestart: () => void; 
  onReset: () => void; 
}) {
  const handleReportError = () => {
    Alert.alert(
      'Report Error',
      `Error ID: ${errorId}\n\nWould you like to report this error? This helps us improve the app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          onPress: () => {
            // Here you could send error to your error reporting service
            logger.info('User chose to report error:', errorId);
            Alert.alert('Thank you', 'Error report sent. We\'ll look into this issue.');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#FF6B6B" />
        <Text style={styles.title}>Oops! Something went wrong</Text>
        <Text style={styles.subtitle}>
          We encountered an unexpected error during onboarding.
        </Text>
        
        <View style={styles.errorDetails}>
          <Text style={styles.errorTitle}>Error Details:</Text>
          <Text style={styles.errorMessage} numberOfLines={3}>
            {error.message || 'Unknown error occurred'}
          </Text>
          <Text style={styles.errorId}>ID: {errorId}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={onReset}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={onRestart}>
            <Text style={styles.secondaryButtonText}>Restart Onboarding</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.reportButton} onPress={handleReportError}>
            <Text style={styles.reportButtonText}>Report Error</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  errorDetails: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E53E3E',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 12,
    color: '#2D3748',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  errorId: {
    fontSize: 10,
    color: '#A0AEC0',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    marginTop: 24,
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3498DB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#ECF0F1',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: '500',
  },
  reportButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#7F8C8D',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default OnboardingErrorBoundary; 