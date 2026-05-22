/**
 * Auth bypass for local MVP build (Phases 0–6).
 * Set DISABLE_AUTH=false in .env.local to re-enable login/signup.
 */
export function isAuthDisabled(): boolean {
  const value = process.env.DISABLE_AUTH;

  if (value === 'false' || value === '0') {
    return false;
  }

  if (value === 'true' || value === '1') {
    return true;
  }

  // Default: bypass auth while MVP phases are in progress
  return true;
}
