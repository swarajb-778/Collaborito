import React from 'react';
import { Redirect } from 'expo-router';

export default function OnboardingRedirect() {
  // This file ensures that /onboarding redirects to /onboarding/
  return <Redirect href="/onboarding/" />;
} 