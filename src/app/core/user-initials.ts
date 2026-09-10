export function userInitials(user: { displayName?: string | null; email?: string | null } | null | undefined): string {
  const source = user?.displayName?.trim() || user?.email || 'R';
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return `${parts[0]?.[0] ?? 'R'}${parts[1]?.[0] ?? ''}`.toUpperCase();
}
