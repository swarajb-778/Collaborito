const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Edge Functions in detail...\n');

async function testEdgeFunctions() {
  try {
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    
    // Test onboarding-handler function
    console.log('📋 Testing onboarding-handler function...');
    try {
      const { data: handlerData, error: handlerError } = await serviceClient.functions.invoke('onboarding-handler', {
        body: { 
          step: 'get_interests'
        }
      });
      
      if (handlerError) {
        console.log('❌ onboarding-handler error:', handlerError);
      } else {
        console.log('✅ onboarding-handler responded successfully');
        console.log('Response:', JSON.stringify(handlerData, null, 2));
      }
    } catch (err) {
      console.log('💥 onboarding-handler exception:', err.message);
    }

    // Test with authenticated user simulation
    console.log('\n🔐 Testing with simulated user ID...');
    try {
      const { data: authData, error: authError } = await serviceClient.functions.invoke('onboarding-handler', {
        body: { 
          step: 'get_interests',
          userId: '00000000-0000-0000-0000-000000000000' // Test UUID
        }
      });
      
      if (authError) {
        console.log('❌ Authenticated test error:', authError);
      } else {
        console.log('✅ Authenticated test responded successfully');
        console.log('Response:', JSON.stringify(authData, null, 2));
      }
    } catch (err) {
      console.log('💥 Authenticated test exception:', err.message);
    }

    // Test onboarding-status function
    console.log('\n📊 Testing onboarding-status function...');
    try {
      const { data: statusData, error: statusError } = await serviceClient.functions.invoke('onboarding-status', {
        body: { 
          action: 'get_status'
        }
      });
      
      if (statusError) {
        console.log('❌ onboarding-status error:', statusError);
      } else {
        console.log('✅ onboarding-status responded successfully');
        console.log('Response:', JSON.stringify(statusData, null, 2));
      }
    } catch (err) {
      console.log('💥 onboarding-status exception:', err.message);
    }

    // Test with basic GET request simulation
    console.log('\n🌐 Testing with HTTP GET simulation...');
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/onboarding-handler`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ step: 'get_interests' })
      });
      
      console.log('HTTP Response Status:', response.status);
      console.log('HTTP Response Status Text:', response.statusText);
      
      const responseText = await response.text();
      console.log('HTTP Response Body:', responseText);
      
    } catch (err) {
      console.log('💥 HTTP test exception:', err.message);
    }

  } catch (error) {
    console.error('💥 Critical error during Edge Function tests:', error);
  }
}

// Run the test
testEdgeFunctions(); 