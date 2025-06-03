/**
 * Comprehensive polyfills for React Native compatibility
 * Import this file at the very beginning of your app to ensure
 * Node.js module compatibility
 */

// URL polyfill for React Native
import 'react-native-url-polyfill/auto';

// Base64 polyfill for file operations
import { decode, encode } from 'base64-arraybuffer';

// Make base64 functions globally available
if (typeof global !== 'undefined') {
  global.Buffer = global.Buffer || require('buffer').Buffer;
  
  // Polyfill for btoa/atob if needed
  if (typeof global.btoa === 'undefined') {
    global.btoa = (str) => {
      return Buffer.from(str, 'binary').toString('base64');
    };
  }
  
  if (typeof global.atob === 'undefined') {
    global.atob = (b64Encoded) => {
      return Buffer.from(b64Encoded, 'base64').toString('binary');
    };
  }
}

// Export polyfills for explicit imports if needed
export {
  decode as base64Decode,
  encode as base64Encode,
}; 