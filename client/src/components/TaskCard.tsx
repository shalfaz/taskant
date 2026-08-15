import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign } from 'lucide-react';
import type { Task } from '../types';
import { Badge, VerifiedBadge, StarRating } from './ui/Card';
import { formatCurrency, formatDate, timeAgo } from '../utils/format';
import Button from './ui/Button';

export default function TaskCard({ task, showActions = true }: { task: Task; showActions?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-brand-200 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge status={task.status} />
            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">{task.category}</span>
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-2">
            {task.title}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-brand-600">{formatCurrency(task.budget)}</p>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <MapPin className="w-4 h-4 shrink-0" />
          <span>{task.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Clock className="w-4 h-4 shrink-0" />
          <span>Due {formatDate(task.deadline)}</span>
        </div>
      </div>

      {task.poster && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700">
              {task.poster.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-gray-700">{task.poster.fullName}</span>
                {task.poster.verificationStatus === 'Verified' && <VerifiedBadge />}
              </div>
              <StarRating rating={task.poster.rating} />
            </div>
          </div>
          <span className="text-xs text-gray-400">{timeAgo(task.createdAt)}</span>
        </div>
      )}

      {showActions && (
        <div className="mt-4">
          <Link to={`/tasks/${task._id}`}>
            <Button variant="outline" className="w-full">View Details</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
