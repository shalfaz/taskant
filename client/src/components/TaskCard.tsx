import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Bookmark, Clock, Flag, MapPin, Share2, Users } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { reportsApi } from '../services/api';
import { REPORT_TYPES, type Task } from '../types';
import { VerifiedBadge } from './ui/Card';
import { formatCurrency, formatDate, timeAgo } from '../utils/format';

export default function TaskCard({ task, showActions = true }: { task: Task; showActions?: boolean }) {
  const { user } = useAuth();
  const key = user ? `taskant_saved_${user._id}` : '';
  const [saved, setSaved] = useState(() => {
    if (!key || typeof window === 'undefined') return false;
    try { return (JSON.parse(localStorage.getItem(key) || '[]') as string[]).includes(task._id); } catch { return false; }
  });
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);
  const toggleSaved = () => {
    if (!key) return;
    let ids: string[] = [];
    try { ids = JSON.parse(localStorage.getItem(key) || '[]') as string[]; } catch { ids = []; }
    const next = ids.includes(task._id) ? ids.filter((id) => id !== task._id) : [...ids, task._id];
    localStorage.setItem(key, JSON.stringify(next));
    setSaved(next.includes(task._id));
  };
  const posterName = task.poster?.fullName || 'TaskAnt member';
  const isPreview = task._id.startsWith('preview-');
  const isOwner = user?._id === task.posterId;
  const actionLabel = isOwner
    ? 'manage'
    : task.workerId === user?._id
      ? 'track'
      : task.status === 'Completed'
        ? 'view'
        : 'apply';
  const locationLabel = task.pickup && task.destination
    ? `${task.pickup} → ${task.destination}`
    : task.location;

  const shareTask = async () => {
    const url = `${window.location.origin}/tasks/${task._id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: task.title, text: task.description, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Task link copied');
      }
    } catch (error) {
      if ((error as { name?: string }).name !== 'AbortError') {
        toast.error('Unable to share this task from your browser.');
      }
    }
  };

  const submitReport = async (event: React.FormEvent) => {
    event.preventDefault();
    setReporting(true);
    try {
      await reportsApi.create({
        reportType,
        description: `${reportType}: ${reportDescription.trim()}`,
        relatedTaskId: task._id,
        relatedUserId: task.posterId,
      });
      toast.success('Report submitted for review');
      setReportDescription('');
      setReportOpen(false);
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to submit report');
    } finally {
      setReporting(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 px-4 pt-3.5">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-bold text-white">{task.poster?.profilePhoto ? <Image src={task.poster.profilePhoto} alt="" fill sizes="40px" className="object-cover" unoptimized /> : posterName.charAt(0)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1"><p className="truncate text-sm font-bold text-slate-950">{posterName}</p>{task.poster?.verificationStatus === 'Verified' && <VerifiedBadge />}</div>
          <p className="truncate text-xs text-slate-500">{timeAgo(task.createdAt)} · {locationLabel}</p>
        </div>
        {!isPreview && user && <button type="button" aria-label={saved ? 'Remove saved task' : 'Save task'} onClick={toggleSaved} title={saved ? 'Remove saved task' : 'Save task'} className={`flex h-8 w-8 items-center justify-center rounded-full ${saved ? 'bg-orange-50 text-orange-600' : 'text-slate-400 hover:bg-slate-100'}`}><Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} /></button>}
        {!isPreview && <button type="button" aria-label="Share task" onClick={() => void shareTask()} title="Share task" className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"><Share2 className="h-4 w-4" /></button>}
      </header>

      <div className="px-4 pb-3 pt-3">
        {!!task.attachments?.length && <div className="mb-3 flex gap-2 overflow-x-auto">{task.attachments.map((src) => <Image key={src} src={src} alt={`Photo for ${task.title}`} width={180} height={120} className="h-28 w-40 shrink-0 rounded-lg object-cover" unoptimized />)}</div>}
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-[15px] font-bold leading-5 text-slate-950">{task.title}</h3>
          <span className="shrink-0 text-sm font-extrabold text-orange-600">{formatCurrency(task.budget)}</span>
        </div>
        {isPreview && <span className="mt-2 inline-flex rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">Demo preview</span>}
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-slate-600">{task.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-orange-500" />{locationLabel}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" />Due {formatDate(task.deadline)}</span>
          <span className="font-semibold text-slate-600">{task.category}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : task.status === 'Cancelled' ? 'bg-slate-100 text-slate-500' : task.status === 'Assigned' || task.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{task.status}</span>
        </div>
      </div>

      {showActions && (
        <div className="mx-4 flex items-center border-y border-slate-100 py-2">
          <span className="flex items-center gap-1.5 text-xs text-slate-500"><Users className="h-4 w-4" />{task.bidCount ?? 0} bids</span>
          {isPreview ? (
            <span className="ml-auto text-xs font-bold text-slate-400">Demo · applications unavailable</span>
          ) : (
            <div className="ml-auto flex items-center gap-1">
              {user && task.posterId !== user._id && <button type="button" onClick={() => setReportOpen((open) => !open)} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"><Flag className="h-3.5 w-3.5" /> Report</button>}
              <Link href={`/tasks/${task._id}`} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-bold text-orange-600 hover:bg-orange-50">
                View details · {actionLabel} <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}
      {reportOpen && !isPreview && (
        <form onSubmit={submitReport} className="space-y-2 px-4 py-3">
          <label className="block text-xs font-semibold text-slate-600">
            Report reason
            <select value={reportType} onChange={(event) => setReportType(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm">
              {REPORT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <textarea required minLength={10} value={reportDescription} onChange={(event) => setReportDescription(event.target.value)} placeholder="Tell us what concerns you about this task (at least 10 characters)." className="min-h-20 w-full rounded-md border border-slate-200 p-2 text-sm outline-none focus:border-orange-400" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setReportOpen(false)} className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={reporting} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">{reporting ? 'Submitting…' : 'Submit report'}</button>
          </div>
        </form>
      )}
    </article>
  );
}
