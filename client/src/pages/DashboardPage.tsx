'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeDollarSign, BriefcaseBusiness, Image as ImageIcon } from 'lucide-react';
import { dashboardApi, tasksApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/Card';
import TaskCard from '../components/TaskCard';
import type { Task } from '../types';

const previewTasks = [
  {
    _id: 'preview-dhaka-documents',
    title: 'Collect university documents from Motijheel',
    description: 'Please collect a sealed document envelope from the university office and deliver it near Dhanmondi 27.',
    category: 'Document & Office Work',
    location: 'Motijheel to Dhanmondi, Dhaka',
    deadline: '2026-11-07T18:00:00.000Z',
    budget: 650,
    status: 'Open',
    posterId: 'preview-user-1',
    bidCount: 4,
    poster: { _id: 'preview-user-1', fullName: 'Nusrat Jahan', location: 'Dhanmondi, Dhaka', role: 'user', verificationStatus: 'Verified', rating: 4.8, reviewCount: 12, completedTasks: 8, postedTasks: 15, createdAt: '2026-11-01T00:00:00.000Z' },
    createdAt: '2026-11-03T07:30:00.000Z',
    updatedAt: '2026-11-03T07:30:00.000Z',
  },
  {
    _id: 'preview-pabna-parcel',
    title: 'Deliver parcel to Pabna New Market',
    description: 'A small package needs to be delivered from my home to a shop inside New Market before evening.',
    category: 'Parcel & Delivery',
    location: 'Pabna Sadar, Pabna',
    deadline: '2026-11-06T16:00:00.000Z',
    budget: 300,
    status: 'Bidding',
    posterId: 'preview-user-2',
    bidCount: 2,
    poster: { _id: 'preview-user-2', fullName: 'Mehedi Hasan', location: 'Pabna, Pabna', role: 'user', verificationStatus: 'Verified', rating: 4.6, reviewCount: 9, completedTasks: 11, postedTasks: 7, createdAt: '2026-11-01T00:00:00.000Z' },
    createdAt: '2026-11-03T06:15:00.000Z',
    updatedAt: '2026-11-03T06:15:00.000Z',
  },
  {
    _id: 'preview-grocery-shopping',
    title: 'Pick up groceries from Bashundhara super shop',
    description: 'A grocery list is ready for collection. Please purchase the items and deliver them to my apartment in the evening.',
    category: 'Shopping & Errands',
    location: 'Bashundhara R/A, Dhaka',
    deadline: '2026-11-05T19:00:00.000Z',
    budget: 500,
    status: 'Open',
    posterId: 'preview-user-3',
    bidCount: 3,
    poster: { _id: 'preview-user-3', fullName: 'Farhana Akter', location: 'Bashundhara, Dhaka', role: 'user', verificationStatus: 'Verified', rating: 4.9, reviewCount: 18, completedTasks: 14, postedTasks: 9, createdAt: '2026-11-01T00:00:00.000Z' },
    createdAt: '2026-11-03T05:45:00.000Z',
    updatedAt: '2026-11-03T05:45:00.000Z',
  },
  {
    _id: 'preview-chittagong-move',
    title: 'Help move a small desk to Agrabad',
    description: 'Need one reliable helper to carry and transport a small desk from Khulshi to an office near Agrabad.',
    category: 'Moving & Delivery',
    location: 'Khulshi to Agrabad, Chattogram',
    deadline: '2026-11-08T15:00:00.000Z',
    budget: 900,
    status: 'Bidding',
    posterId: 'preview-user-4',
    bidCount: 5,
    poster: { _id: 'preview-user-4', fullName: 'Tanvir Ahmed', location: 'Khulshi, Chattogram', role: 'user', verificationStatus: 'Verified', rating: 4.7, reviewCount: 7, completedTasks: 10, postedTasks: 5, createdAt: '2026-11-01T00:00:00.000Z' },
    createdAt: '2026-11-03T04:20:00.000Z',
    updatedAt: '2026-11-03T04:20:00.000Z',
  },
  {
    _id: 'preview-sylhet-event',
    title: 'Assist with event setup in Zindabazar',
    description: 'Looking for two patient helpers to arrange chairs, banners, and refreshment tables before a community event.',
    category: 'Event Help',
    location: 'Zindabazar, Sylhet',
    deadline: '2026-11-09T10:00:00.000Z',
    budget: 1200,
    status: 'Open',
    posterId: 'preview-user-5',
    bidCount: 6,
    poster: { _id: 'preview-user-5', fullName: 'Rafiul Islam', location: 'Zindabazar, Sylhet', role: 'user', verificationStatus: 'Verified', rating: 4.8, reviewCount: 21, completedTasks: 25, postedTasks: 13, createdAt: '2026-11-01T00:00:00.000Z' },
    createdAt: '2026-11-03T03:10:00.000Z',
    updatedAt: '2026-11-03T03:10:00.000Z',
  },
  {
    _id: 'preview-rajshahi-tutor',
    title: 'Find a tutor for Class 8 mathematics',
    description: 'One evening tutoring session is needed for a Class 8 student near Rajshahi University.',
    category: 'Tutoring',
    location: 'Binodpur, Rajshahi',
    deadline: '2026-11-10T17:30:00.000Z',
    budget: 800,
    status: 'Open',
    posterId: 'preview-user-6',
    bidCount: 2,
    poster: { _id: 'preview-user-6', fullName: 'Sadia Rahman', location: 'Rajshahi University, Rajshahi', role: 'user', verificationStatus: 'Verified', rating: 4.9, reviewCount: 16, completedTasks: 9, postedTasks: 11, createdAt: '2026-11-01T00:00:00.000Z' },
    createdAt: '2026-11-03T02:00:00.000Z',
    updatedAt: '2026-11-03T02:00:00.000Z',
  },
] as Task[];

export default function DashboardPage() {
  const { user } = useAuth();
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const response = await dashboardApi.get();
        setAvailableTasks(response.data.availableTasks ?? []);
      } catch {
        try {
          const response = await tasksApi.featured();
          setAvailableTasks((response.data.tasks ?? []).filter((task: Task) => task.posterId !== user?._id));
        } catch {
          setAvailableTasks([]);
        }
      } finally {
        setLoading(false);
      }
    };
    void loadFeed();
  }, [user?._id]);

  const feedTasks = [...availableTasks, ...previewTasks];

  return (
    <div className="mx-auto w-full max-w-140 px-3 py-3 sm:px-0">
      <Link href="/post-task" className="mb-3 block rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{user?.fullName.charAt(0)}</div>
          <div className="flex h-9 flex-1 items-center rounded-full bg-slate-100 px-4 text-sm text-slate-500">Share a task or ask for local help...</div>
        </div>
        <div className="mt-2.5 flex border-t border-slate-100 pt-2 text-xs font-semibold text-slate-600">
          <span className="flex flex-1 items-center justify-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-orange-500" /> Task</span>
          <span className="flex flex-1 items-center justify-center gap-2"><BadgeDollarSign className="h-4 w-4 text-emerald-600" /> Budget</span>
          <span className="flex flex-1 items-center justify-center gap-2"><ImageIcon className="h-4 w-4 text-blue-500" /> Photos</span>
        </div>
      </Link>

      {loading ? (
        <LoadingSpinner className="min-h-40" />
      ) : (
        <div className="space-y-3">
          {feedTasks.map((task) => <TaskCard key={task._id} task={task} />)}
          {!feedTasks.length && (
            <div className="rounded-lg border border-slate-200 bg-white px-5 py-7 text-center">
              <p className="text-sm font-bold text-slate-800">No public tasks available</p>
              <p className="mt-1 text-xs text-slate-500">New opportunities will appear here when they are posted.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
