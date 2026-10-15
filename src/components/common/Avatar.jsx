import React, { useState, useEffect } from 'react';
import { getAvatarPalette, getInitials, getInitialsDataUri } from '../../utils/avatarUtils';

export { getAvatarPalette, getInitials, getInitialsDataUri };

/**
 * Avatar component with automatic graceful fallback.
 * If image fails to load (offline, network error, or invalid URL),
 * it renders a clean, accessible colored initials badge.
 */
export function Avatar({
  src,
  name = '',
  className = 'w-7 h-7',
  alt = ''
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initials = getInitials(name);
  const palette = getAvatarPalette(name);

  const fontSizeClass = className.includes('text-')
    ? ''
    : className.includes('w-6')
    ? 'text-[10px]'
    : className.includes('w-7')
    ? 'text-[11px]'
    : className.includes('w-8')
    ? 'text-xs'
    : className.includes('w-10')
    ? 'text-sm'
    : className.includes('w-12')
    ? 'text-base'
    : 'text-xs';

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        onError={() => setHasError(true)}
        className={`rounded-full object-cover border border-slate-200 flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold border flex-shrink-0 select-none ${palette.bg} ${palette.text} ${palette.border} ${fontSizeClass} ${className}`}
      title={name}
      aria-label={name || 'Avatar'}
    >
      <span className="leading-none">{initials}</span>
    </div>
  );
}

export default Avatar;
