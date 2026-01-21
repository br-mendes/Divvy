export const SYSTEM_ADMIN_EMAILS = [
  'falecomdivvy@gmail.com',
  'brunoafonso.mendes@gmail.com',
].map((s) => s.toLowerCase().trim());

export function isSystemAdminEmail(email?: string | null) {
  if (!email) return false;
  return SYSTEM_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
