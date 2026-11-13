/**
 * Debug hooks exist only in dev / QA builds and only when the URL asks for them.
 * Always call as `__DEBUG__ && debugFlag('name')`: __DEBUG__ is a compile-time
 * constant (vite.config.ts), so production builds drop the call and its strings.
 */
export function debugFlag(name: string): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has(name);
}
