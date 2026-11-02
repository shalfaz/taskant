import Link from 'next/link';
import { MapPin, Clock, Users, ArrowUpRight, Bookmark } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Task } from '../types';
import { Badge, VerifiedBadge } from './ui/Card';
import { formatCurrency, formatDate, timeAgo } from '../utils/format';

export default function TaskCard({ task, showActions = true }: { task: Task; showActions?: boolean }) {
  const { user } = useAuth();
  const key = user ? `taskant_saved_${user._id}` : '';
  const [saved, setSaved] = useState(() => {
    if (!key || typeof window === 'undefined') return false;
    try { return (JSON.parse(localStorage.getItem(key) || '[]') as string[]).includes(task._id); } catch { return false; }
  });
  const toggleSaved = () => {
    if (!key) return;
    let ids: string[] = [];
    try { ids = JSON.parse(localStorage.getItem(key) || '[]') as string[]; } catch { ids = []; }
    const next = ids.includes(task._id) ? ids.filter((id) => id !== task._id) : [...ids, task._id];
    localStorage.setItem(key, JSON.stringify(next));
    setSaved(next.includes(task._id));
  };
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-orange-200 hover:shadow-md">
      {task.poster && (
        <div className="flex items-center gap-3 px-5 pt-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{task.poster.fullName.charAt(0)}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5"><span className="truncate text-sm font-bold text-slate-900">{task.poster.fullName}</span>{task.poster.verificationStatus === 'Verified' && <VerifiedBadge />}</div>
            <p className="text-xs text-slate-500">{timeAgo(task.createdAt)} · {task.category}</p>
          </div>
          <div className="ml-auto flex items-center gap-2"><Badge status={task.status} /><button type="button" title={saved ? 'Remove from saved tasks' : 'Save task'} aria-label={saved ? 'Remove from saved tasks' : 'Save task'} onClick={toggleSaved} className={`rounded-full p-2 ${saved ? 'bg-orange-50 text-orange-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}><Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} /></button></div>
        </div>
      )}
      <div className="p-5">
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

      <p className="mb-4 line-clamp-2 text-sm leading-6 text-slate-600">{task.description}</p>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
        <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-orange-500" /><span className="truncate">{task.location}</span></div>
        <div className="flex items-center justify-end gap-1.5"><Clock className="h-4 w-4 text-orange-500" />Due {formatDate(task.deadline)}</div>
        <div className="col-span-2 flex items-center gap-1.5 border-t border-slate-200 pt-2"><Users className="h-4 w-4 text-slate-400" />{task.bidCount ?? 0} bids</div>
      </div>

      {showActions && (
        <div className="mt-4">
          <Link href={`/tasks/${task._id}`} className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-2.5 text-sm font-bold text-white hover:bg-orange-700">
            View details & apply <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
    </article>
  );
}
