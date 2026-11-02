'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BadgeDollarSign, CheckSquare, ChevronRight, Clock3, Image as ImageIcon, ListTodo,
  MapPin, Plus, Search, SlidersHorizontal, Sparkles,
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/Card';
import TaskCard from '../components/TaskCard';
import { formatCurrency } from '../utils/format';
import { TASK_CATEGORIES, type Task, type Bid, type DashboardStats } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{
    stats: DashboardStats;
    recentPosted: Task[];
    recentAccepted: Task[];
    availableTasks: Task[];
    pendingBids: (Bid & { task?: Task })[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get().then((res) => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[60vh]" />;

  const tasks = data?.availableTasks ?? [];
  const stats = data?.stats;

  return (
    <div className="mx-auto grid grid-cols-1 gap-5 px-3 py-5 xl:grid-cols-[minmax(0,680px)_300px] 2xl:grid-cols-[minmax(0,680px)_300px]" style={{ maxWidth: 1180 }}>
      <section className="min-w-0">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Local marketplace</p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Good morning, {user?.fullName.split(' ')[0]}</h1>
          </div>
          <div className="hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:flex">
            <MapPin className="h-4 w-4 text-orange-500" /> {user?.location}
          </div>
        </div>

        <Link href="/post-task" className="mb-4 block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{user?.fullName.charAt(0)}</div>
            <div className="flex h-11 flex-1 items-center rounded-full bg-slate-100 px-5 text-sm text-slate-500">What task needs doing?</div>
            <button className="hidden h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600 sm:flex"><Plus className="h-5 w-5" /></button>
          </div>
          <div className="mt-3 flex border-t border-slate-100 pt-3">
            <span className="flex flex-1 items-center justify-center gap-2 text-xs font-bold text-slate-600"><BadgeDollarSign className="h-4 w-4 text-orange-500" /> Set a budget</span>
            <span className="flex flex-1 items-center justify-center gap-2 border-l border-slate-100 text-xs font-bold text-slate-600"><ImageIcon className="h-4 w-4 text-blue-500" /> Add details</span>
          </div>
        </Link>

        {stats && (
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Posted', value: stats.postedCount, icon: ListTodo },
              { label: 'Accepted', value: stats.acceptedCount, icon: CheckSquare },
              { label: 'Earned', value: formatCurrency(stats.earnings), icon: BadgeDollarSign },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-3">
                <item.icon className="mb-2 h-4 w-4 text-orange-500" />
                <p className="text-lg font-extrabold text-slate-950">{item.value}</p>
                <p className="text-[11px] font-semibold text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-slate-950">Fresh in your area</h2>
            <p className="text-xs text-slate-500">{tasks.length} opportunities available</p>
          </div>
          <Link href="/tasks" className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"><SlidersHorizontal className="h-3.5 w-3.5" /> Filter</Link>
        </div>

        <div className="space-y-4">
          {tasks.length ? tasks.map((task) => <TaskCard key={task._id} task={task} />) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
              <Search className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <h3 className="font-bold text-slate-900">No tasks available yet</h3>
              <p className="mt-1 text-sm text-slate-500">Check back soon or post the first task in your area.</p>
            </div>
          )}
        </div>
      </section>

      <aside className="hidden space-y-4 xl:block">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-950">Nearby tasks</h2>
            <Link href="/tasks" className="text-xs font-bold text-orange-600">See all</Link>
          </div>
          <div className="space-y-3">
            {tasks.slice(0, 3).map((task) => (
              <Link key={task._id} href={`/tasks/${task._id}`} className="group flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><MapPin className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-800 group-hover:text-orange-600">{task.title}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><Clock3 className="h-3 w-3" /> {task.location}</p>
                </div>
                <span className="ml-auto text-xs font-extrabold text-orange-600">{formatCurrency(task.budget)}</span>
              </Link>
            ))}
            {!tasks.length && <p className="text-xs text-slate-500">No nearby tasks are available.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-extrabold text-slate-950">Popular categories</h2>
          <div className="flex flex-wrap gap-2">
            {TASK_CATEGORIES.slice(0, 6).map((category) => (
              <Link key={category} href={`/tasks?category=${encodeURIComponent(category)}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-orange-50 hover:text-orange-700">
                {category}
              </Link>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-slate-950 p-4 text-white">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500"><Sparkles className="h-5 w-5" /></div>
          <h2 className="text-sm font-extrabold">Build a reliable local network</h2>
          <p className="mt-1 text-xs leading-5 text-slate-300">Complete tasks, earn reviews, and discover trusted people nearby.</p>
          <Link href="/reviews" className="mt-3 flex items-center text-xs font-bold text-orange-400">View your reviews <ChevronRight className="h-4 w-4" /></Link>
        </div>
      </aside>
    </div>
  );
}
