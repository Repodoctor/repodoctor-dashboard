export function passwordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  score = Math.min(4, score);
  const labels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  return { score, label: password.length === 0 ? '' : labels[score] ?? 'Too weak' };
}
