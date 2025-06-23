// Type declarations for Deno runtime (for Edge Functions)
// This file helps TypeScript understand Deno globals when developing locally

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  
  export const env: Env;
  
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: { port?: number; hostname?: string }
  ): void;
}

// Declare global Deno variable
declare const Deno: typeof Deno; 