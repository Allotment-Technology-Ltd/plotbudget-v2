// Re-export the proxy function as the Next.js middleware default export.
// Logic lives in proxy.ts so it can be unit-tested and reused independently.
export { proxy as default, config } from './proxy';
