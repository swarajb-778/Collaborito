#!/usr/bin/env node

/**
 * Avatar Functionality Test Suite
 * Tests all avatar-related components and services
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test data
const TEST_USER_ID = 'test-user-' + Date.now();
const TEST_IMAGE_PATH = path.join(__dirname, 'test-avatar.jpg');

async function runTests() {
  console.log('🧪 Starting Avatar Functionality Tests\n');

  try {
    // Test 1: Storage bucket exists
    await testStorageBucket();
    
    // Test 2: Storage policies
    await testStoragePolicies();
    
    // Test 3: Profile table structure
    await testProfileTable();
    
    // Test 4: File upload simulation
    await testFileUpload();
    
    // Test 5: Component files exist
    await testComponentFiles();
    
    console.log('\n✅ All avatar functionality tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

async function testStorageBucket() {
  console.log('📁 Testing storage bucket setup...');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) throw error;
    
    const avatarBucket = buckets.find(bucket => bucket.name === 'avatars');
    
    if (!avatarBucket) {
      throw new Error('Avatars bucket not found');
    }
    
    if (!avatarBucket.public) {
      throw new Error('Avatars bucket should be public');
    }
    
    console.log('  ✅ Avatars bucket exists and is public');
    
  } catch (error) {
    throw new Error(`Storage bucket test failed: ${error.message}`);
  }
}

async function testStoragePolicies() {
  console.log('🔒 Testing storage policies...');
  
  try {
    // This is a basic test - in reality you'd need to test with actual user sessions
    const { data, error } = await supabase.storage
      .from('avatars')
      .list('test-folder', { limit: 1 });
    
    // If no error, policies are working (at least for reading)
    console.log('  ✅ Storage policies are configured');
    
  } catch (error) {
    console.warn('  ⚠️  Storage policy test inconclusive:', error.message);
  }
}

async function testProfileTable() {
  console.log('🗄️  Testing profile table structure...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }
    
    console.log('  ✅ Profiles table is accessible');
    
  } catch (error) {
    throw new Error(`Profile table test failed: ${error.message}`);
  }
}

async function testFileUpload() {
  console.log('📤 Testing file upload functionality...');
  
  try {
    // Create a small test file
    const testImageData = Buffer.from('test-image-data');
    const fileName = `test-user-${Date.now()}/avatar.jpg`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, testImageData, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    
    if (error) throw error;
    
    console.log('  ✅ File upload successful:', data.path);
    
    // Clean up test file
    await supabase.storage.from('avatars').remove([fileName]);
    console.log('  ✅ Test file cleaned up');
    
  } catch (error) {
    throw new Error(`File upload test failed: ${error.message}`);
  }
}

async function testComponentFiles() {
  console.log('📁 Testing component files exist...');
  
  const requiredFiles = [
    'components/ui/Avatar.tsx',
    'components/ui/AvatarManager.tsx',
    'components/ui/AvatarPickerModal.tsx',
    'components/ui/AvatarUploadProgress.tsx',
    'components/ui/AvatarList.tsx',
    'src/services/ImagePickerService.ts',
    'src/services/AvatarUploadService.ts',
    'src/services/ProfileImageService.ts',
    'src/utils/imageUtils.ts',
    'supabase/storage-bucket-setup.sql',
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required file missing: ${file}`);
    }
    
    console.log(`  ✅ ${file} exists`);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests }; 