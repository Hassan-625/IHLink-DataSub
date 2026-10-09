export function signedOutNativeAccess(path: string): 'welcome' | 'public' | 'signin' {
  if (path === '/' || path === '/datasub') return 'welcome';
  if (/^\/(?:signin|register|reset-password|verify-email|auth\/(?:handoff|update-password))\/?$/.test(path)) return 'public';
  if (/^\/(?:datasub\/)?(?:support|get-in-touch|privacy|terms)\/?$/.test(path)) return 'public';
  return 'signin';
}
