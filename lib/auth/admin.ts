export const SYSTEM_ADMIN_EMAILS = new Set([
  'falecomdivvy@gmail.com',
  'brunoafonso.mendes@gmail.com',
]);

export function isSystemAdminEmail(email?: string | null) {
  if (!email) return false;
  return SYSTEM_ADMIN_EMAILS.has(email.toLowerCase());
}
