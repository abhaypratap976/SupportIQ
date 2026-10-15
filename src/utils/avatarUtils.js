export const AVATAR_PALETTES = [
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', hexBg: '#EEF2FF', hexFg: '#4338CA' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', hexBg: '#ECFDF5', hexFg: '#065F46' },
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', hexBg: '#EFF6FF', hexFg: '#1E40AF' },
  { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', hexBg: '#F5F3FF', hexFg: '#5B21B6' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', hexBg: '#FFFBEB', hexFg: '#92400E' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', hexBg: '#FFF1F2', hexFg: '#9F1239' },
  { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', hexBg: '#F0FDFA', hexFg: '#115E59' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200', hexBg: '#ECFEFF', hexFg: '#155E75' },
];

export function getAvatarPalette(name = '') {
  let hash = 0;
  const str = String(name || 'User');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

export function getInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const clean = name.trim();
  if (!clean) return 'U';
  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return clean.slice(0, Math.min(2, clean.length)).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generate an offline, lightweight SVG data URI for initials.
 * Zero network dependencies - renders immediately offline on all devices.
 */
export function getInitialsDataUri(name = 'User') {
  const initials = getInitials(name);
  const palette = getAvatarPalette(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="32" fill="${palette.hexBg}" stroke="#CBD5E1" stroke-width="1.5"/><text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="${palette.hexFg}" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
