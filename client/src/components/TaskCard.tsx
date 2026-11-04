import Link from 'next/link';
import { ArrowUpRight, Bookmark, Clock, MapPin, MoreHorizontal, Users } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Task } from '../types';
import { VerifiedBadge } from './ui/Card';
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
  const posterName = task.poster?.fullName || 'TaskAnt member';

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 px-4 pt-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{posterName.charAt(0)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1"><p className="truncate text-sm font-bold text-slate-950">{posterName}</p>{task.poster?.verificationStatus === 'Verified' && <VerifiedBadge />}</div>
          <p className="truncate text-xs text-slate-500">{timeAgo(task.createdAt)} · {task.location}</p>
        </div>
        <button type="button" aria-label="Save task" onClick={toggleSaved} title={saved ? 'Remove saved task' : 'Save task'} className={`flex h-8 w-8 items-center justify-center rounded-full ${saved ? 'bg-orange-50 text-orange-600' : 'text-slate-400 hover:bg-slate-100'}`}><Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} /></button>
        <button type="button" aria-label="Post menu" className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"><MoreHorizontal className="h-5 w-5" /></button>
      </header>

      <div className="px-4 pb-3 pt-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-[15px] font-bold leading-5 text-slate-950">{task.title}</h3>
          <span className="shrink-0 text-sm font-extrabold text-orange-600">{formatCurrency(task.budget)}</span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-slate-600">{task.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-orange-500" />{task.location}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" />Due {formatDate(task.deadline)}</span>
          <span className="font-semibold text-slate-600">{task.category}</span>
        </div>
      </div>

      {showActions && (
        <div className="mx-4 flex items-center border-y border-slate-100 py-2">
          <span className="flex items-center gap-1.5 text-xs text-slate-500"><Users className="h-4 w-4" />{task.bidCount ?? 0} bids</span>
          <Link href={`/tasks/${task._id}`} className="ml-auto flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-bold text-orange-600 hover:bg-orange-50">
            View details & apply <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </article>
  );
}
