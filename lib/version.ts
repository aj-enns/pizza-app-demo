/**
 * Reads the current application version from the APP_VERSION env var
 * (injected at build time via next.config.js from the VERSION file).
 * Safe to use in both server and client components.
 */
export function getVersion(): string {
  return process.env.APP_VERSION || '0.0.0';
}
