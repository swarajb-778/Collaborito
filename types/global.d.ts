/// <reference types="expo/types" />

// Global type declarations for the application

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

// Module declarations for better TypeScript support with path aliases
declare module '@/components/*' {
  const content: any;
  export default content;
}

declare module '@/constants/*' {
  const content: any;
  export default content;
}

declare module '@/hooks/*' {
  const content: any;
  export default content;
}

declare module '@/utils/*' {
  const content: any;
  export default content;
}

declare module '@/services/*' {
  const content: any;
  export default content;
}

declare module '@/contexts/*' {
  const content: any;
  export default content;
}

// Export to make this a module
export {}; 