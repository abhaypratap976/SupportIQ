// Date and string formatting utilities for SupportIQ

/**
 * Format an ISO date string to a human-readable relative string (e.g., '2 hours ago', '3 days ago')
 * or a clean date if older.
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Unknown';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 30) return 'just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}w ago`;
  }

  // Format as short date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Format a full readable date with time (e.g. 'Oct 14, 2026 at 4:30 PM')
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return 'Unknown';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid date';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get ticket age in hours or days for highlighting oldest unresolved tickets
 */
export function getTicketAge(dateInput) {
  if (!dateInput) return { days: 0, hours: 0, text: '0h' };
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now - date;
  const hours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const days = Math.floor(hours / 24);

  let text = '';
  if (days > 0) {
    text = `${days}d ${hours % 24}h`;
  } else {
    text = `${hours}h`;
  }

  return { days, hours, text, isOld: hours >= 48 };
}

/**
 * Calculate reading time for knowledge base articles
 */
export function calculateReadTime(content) {
  if (!content) return '1 min read';
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 180);
  return `${minutes} min read`;
}

/**
 * Return friendly time-of-day greeting (e.g. 'Good morning', 'Good afternoon', 'Good evening')
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

