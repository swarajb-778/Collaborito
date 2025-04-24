import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Auto-redirect from the root to welcome
  return <Redirect href="/welcome" />;
} 