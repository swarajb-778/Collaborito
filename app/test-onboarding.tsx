/**
 * Test Onboarding Screen
 * 
 * This screen tests the onboarding integration with Supabase.
 * It allows manual testing of all onboarding operations.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSimpleOnboardingManager, getSeedDataService } from '../src/services';
import initializeOnboardingSystem from '../src/utils/initializeOnboardingSystem';

export default function TestOnboardingScreen() {
  const [status, setStatus] = useState('Initializing...');
  const [progress, setProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Test data
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    location: 'San Francisco, CA',
    jobTitle: 'Software Engineer',
    bio: 'Passionate about building great products'
  });

  const onboardingManager = getSimpleOnboardingManager();

  useEffect(() => {
    initializeSystem();
    
    // Set up event listeners
    onboardingManager.on('progress-updated', (newProgress: any) => {
      setProgress(newProgress);
      addLog(`Progress updated: ${newProgress.currentStep} (${newProgress.percentageComplete}%)`);
    });

    onboardingManager.on('step-completed', (step: string, data: any) => {
      addLog(`Step completed: ${step}`);
    });

    onboardingManager.on('error-occurred', (error: any) => {
      addLog(`Error: ${error.message}`);
    });

    return () => {
      onboardingManager.removeAllListeners();
    };
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  const initializeSystem = async () => {
    try {
      setIsLoading(true);
      addLog('Initializing onboarding system...');
      
      const result = await initializeOnboardingSystem();
      
      if (result) {
        setStatus('System Ready ✅');
        addLog('System initialized successfully');
        
        // Get current progress
        const currentProgress = await onboardingManager.getCurrentProgress();
        setProgress(currentProgress);
      } else {
        setStatus('System Failed ❌');
        addLog('System initialization failed');
      }
         } catch (error) {
       setStatus('System Error ❌');
       addLog(`Initialization error: ${(error as Error).message}`);
     } finally {
      setIsLoading(false);
    }
  };

  const testProfileStep = async () => {
    try {
      setIsLoading(true);
      addLog('Testing profile step...');
      
      const result = await onboardingManager.executeStep('profile', profileData);
      
      if (result.success) {
        addLog('Profile step completed successfully');
        Alert.alert('Success', 'Profile step completed!');
      } else {
        addLog(`Profile step failed: ${result.error}`);
        Alert.alert('Error', result.error || 'Profile step failed');
      }
    } catch (error) {
      addLog(`Profile step error: ${(error as Error).message}`);
      Alert.alert('Error', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const testInterestsStep = async () => {
    try {
      setIsLoading(true);
      addLog('Getting available interests...');
      
      const interests = await onboardingManager.getStepOptions('interests');
      addLog(`Found ${interests.length} interests`);
      
      if (interests.length > 0) {
        const selectedInterests = interests.slice(0, 3).map((i: any) => i.id);
        const result = await onboardingManager.executeStep('interests', {
          interestIds: selectedInterests
        });
        
        if (result.success) {
          addLog('Interests step completed successfully');
          Alert.alert('Success', 'Interests step completed!');
        } else {
          addLog(`Interests step failed: ${result.error}`);
          Alert.alert('Error', result.error || 'Interests step failed');
        }
      } else {
        addLog('No interests available - please seed data first');
        Alert.alert('Warning', 'No interests available. Please seed data first.');
      }
    } catch (error) {
      addLog(`Interests step error: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testGoalsStep = async () => {
    try {
      setIsLoading(true);
      addLog('Testing goals step...');
      
      const result = await onboardingManager.executeStep('goals', {
        goalType: 'find_cofounder',
        details: { experience: 'intermediate', timeline: '3-6 months' }
      });
      
      if (result.success) {
        addLog('Goals step completed successfully');
        Alert.alert('Success', 'Goals step completed!');
      } else {
        addLog(`Goals step failed: ${result.error}`);
        Alert.alert('Error', result.error || 'Goals step failed');
      }
    } catch (error) {
      addLog(`Goals step error: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const seedData = async () => {
    try {
      setIsLoading(true);
      addLog('Seeding initial data...');
      
      const seedService = getSeedDataService();
      const result = await seedService.seedAllData();
      
      if (result) {
        addLog('Data seeded successfully');
        Alert.alert('Success', 'Data seeded successfully!');
      } else {
        addLog('Data seeding failed');
        Alert.alert('Error', 'Data seeding failed');
      }
    } catch (error) {
      addLog(`Data seeding error: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetOnboarding = async () => {
    try {
      setIsLoading(true);
      addLog('Resetting onboarding...');
      
      const result = await onboardingManager.resetOnboarding();
      
      if (result) {
        addLog('Onboarding reset successfully');
        const newProgress = await onboardingManager.getCurrentProgress();
        setProgress(newProgress);
        Alert.alert('Success', 'Onboarding reset successfully!');
      } else {
        addLog('Onboarding reset failed');
        Alert.alert('Error', 'Onboarding reset failed');
      }
    } catch (error) {
      addLog(`Reset error: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
          Onboarding Test Screen
        </Text>

        {/* Status */}
        <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>System Status</Text>
          <Text style={{ fontSize: 16, color: status.includes('✅') ? 'green' : 'red' }}>
            {status}
          </Text>
          
          {progress && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: 'bold' }}>Current Progress:</Text>
              <Text>Step: {progress.currentStep}</Text>
              <Text>Completed: {progress.completedSteps.join(', ') || 'None'}</Text>
              <Text>Progress: {progress.percentageComplete}%</Text>
              <Text>User ID: {progress.userId || 'Not set'}</Text>
            </View>
          )}
        </View>

        {/* Profile Data Input */}
        <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Profile Data</Text>
          
          <TextInput
            style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 10, borderRadius: 5 }}
            placeholder="First Name"
            value={profileData.firstName}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, firstName: text }))}
          />
          
          <TextInput
            style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 10, borderRadius: 5 }}
            placeholder="Last Name"
            value={profileData.lastName}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, lastName: text }))}
          />
          
          <TextInput
            style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 10, borderRadius: 5 }}
            placeholder="Location"
            value={profileData.location}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, location: text }))}
          />
        </View>

        {/* Test Actions */}
        <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Test Actions</Text>
          
          <TouchableOpacity
            style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginBottom: 10 }}
            onPress={seedData}
            disabled={isLoading}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              Seed Initial Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: '#34C759', padding: 15, borderRadius: 8, marginBottom: 10 }}
            onPress={testProfileStep}
            disabled={isLoading}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              Test Profile Step
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: '#FF9500', padding: 15, borderRadius: 8, marginBottom: 10 }}
            onPress={testInterestsStep}
            disabled={isLoading}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              Test Interests Step
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: '#AF52DE', padding: 15, borderRadius: 8, marginBottom: 10 }}
            onPress={testGoalsStep}
            disabled={isLoading}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              Test Goals Step
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: '#FF3B30', padding: 15, borderRadius: 8 }}
            onPress={resetOnboarding}
            disabled={isLoading}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              Reset Onboarding
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logs */}
        <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Activity Log</Text>
          
          {logs.length === 0 ? (
            <Text style={{ color: '#666', fontStyle: 'italic' }}>No activity yet...</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={{ fontSize: 12, color: '#333', marginBottom: 5, fontFamily: 'monospace' }}>
                {log}
              </Text>
            ))
          )}
        </View>

        {isLoading && (
          <View style={{ backgroundColor: 'rgba(0,0,0,0.8)', padding: 20, borderRadius: 10, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 16 }}>Loading...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
} 