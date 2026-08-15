export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString('en-BD')}`;
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Open: 'bg-blue-100 text-blue-700',
    Bidding: 'bg-purple-100 text-purple-700',
    Assigned: 'bg-amber-100 text-amber-700',
    'In Progress': 'bg-orange-100 text-orange-700',
    Completed: 'bg-green-100 text-green-700',
    Cancelled: 'bg-gray-100 text-gray-600',
    Pending: 'bg-yellow-100 text-yellow-700',
    Verified: 'bg-green-100 text-green-700',
    Unverified: 'bg-gray-100 text-gray-600',
    Rejected: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
