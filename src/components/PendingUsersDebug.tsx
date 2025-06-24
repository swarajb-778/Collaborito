import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/AuthService';
import { createLogger } from '../utils/logger';

const logger = createLogger('PendingUsersDebug');

interface PendingUser {
  id: string;
  email: string;
  password: string;
  metadata: any;
  status: string;
  createdAt: string;
  retryAfter: number;
}

export const PendingUsersDebug: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadPendingUsers();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadPendingUsers();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const keys = await AsyncStorage.getAllKeys();
      const pendingKeys = keys.filter(key => key.startsWith('pending_user_'));
      
      const users: PendingUser[] = [];
      for (const key of pendingKeys) {
        const userDataStr = await AsyncStorage.getItem(key);
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            users.push(userData);
          } catch (parseError) {
            logger.error('Failed to parse pending user:', parseError);
          }
        }
      }
      
      // Sort by creation date (newest first)
      users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setPendingUsers(users);
      setLastRefresh(new Date());
      
    } catch (error) {
      logger.error('Failed to load pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPendingUsers = async () => {
    try {
      setLoading(true);
      await authService.processPendingUsers();
      await loadPendingUsers(); // Refresh the list
      Alert.alert('Success', 'Attempted to process all pending users');
    } catch (error) {
      logger.error('Failed to process pending users:', error);
      Alert.alert('Error', 'Failed to process pending users');
    } finally {
      setLoading(false);
    }
  };

  const clearAllPending = async () => {
    Alert.alert(
      'Clear All Pending Users',
      'Are you sure you want to clear all pending users? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const pendingKeys = keys.filter(key => key.startsWith('pending_user_'));
              
              await AsyncStorage.multiRemove(pendingKeys);
              await loadPendingUsers();
              
              Alert.alert('Success', `Cleared ${pendingKeys.length} pending users`);
            } catch (error) {
              logger.error('Failed to clear pending users:', error);
              Alert.alert('Error', 'Failed to clear pending users');
            }
          }
        }
      ]
    );
  };

  const clearSpecificUser = async (user: PendingUser) => {
    try {
      await AsyncStorage.removeItem(`pending_user_${user.email}`);
      await loadPendingUsers();
      Alert.alert('Success', `Cleared pending user: ${user.email}`);
    } catch (error) {
      logger.error('Failed to clear specific user:', error);
      Alert.alert('Error', 'Failed to clear user');
    }
  };

  const getTimeUntilRetry = (retryAfter: number): string => {
    const now = Date.now();
    const timeLeft = retryAfter - now;
    
    if (timeLeft <= 0) {
      return 'Ready for retry';
    }
    
    const minutes = Math.floor(timeLeft / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  if (__DEV__ === false) {
    return null; // Only show in development
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔄 Pending Users Debug</Text>
        <Text style={styles.subtitle}>
          Monitor users created during rate limits
        </Text>
        <Text style={styles.lastRefresh}>
          Last refresh: {lastRefresh.toLocaleTimeString()}
        </Text>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statText}>
          📊 Total Pending: {pendingUsers.length}
        </Text>
        <Text style={styles.statText}>
          ⏰ Ready for retry: {pendingUsers.filter(u => Date.now() >= u.retryAfter).length}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={loadPendingUsers}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={processPendingUsers}
          disabled={loading || pendingUsers.length === 0}
        >
          <Text style={styles.buttonText}>
            ⚡ Process All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={clearAllPending}
          disabled={loading || pendingUsers.length === 0}
        >
          <Text style={styles.buttonText}>
            🗑️ Clear All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.usersList}>
        {pendingUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>✅ No pending users</Text>
            <Text style={styles.emptySubtext}>
              Pending users appear here when Supabase rate limits are hit
            </Text>
          </View>
        ) : (
          pendingUsers.map((user, index) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <Text style={styles.userEmail}>{user.email}</Text>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => clearSpecificUser(user)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.userDetail}>
                📅 Created: {formatDate(user.createdAt)}
              </Text>
              
              <Text style={styles.userDetail}>
                ⏰ Retry in: {getTimeUntilRetry(user.retryAfter)}
              </Text>
              
              <Text style={styles.userDetail}>
                📊 Status: {user.status}
              </Text>
              
              {user.metadata?.username && (
                <Text style={styles.userDetail}>
                  👤 Username: {user.metadata.username}
                </Text>
              )}
              
              <View style={styles.userStatus}>
                {Date.now() >= user.retryAfter ? (
                  <Text style={styles.readyStatus}>🟢 Ready for retry</Text>
                ) : (
                  <Text style={styles.waitingStatus}>🟡 Waiting</Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Tip: Pending users will be automatically processed every 5 minutes
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    maxHeight: 500,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  lastRefresh: {
    fontSize: 12,
    color: '#9ca3af',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    backgroundColor: '#059669',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  usersList: {
    maxHeight: 250,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#059669',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userDetail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userStatus: {
    marginTop: 8,
  },
  readyStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  waitingStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f59e0b',
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
}); 