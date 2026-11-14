'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BriefcaseBusiness, Image as ImageIcon, ListFilter, Search } from 'lucide-react';
import { tasksApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/Card';
import TaskCard from '../components/TaskCard';
import TaskComposer from '../components/TaskComposer';
import type { Task } from '../types';

const categories = [
  'Delivery',
  'Shopping & Errands',
  'Document & Office Work',
  'Home Services',
  'Technology',
  'Education',
  'Others',
];

const demoAuthors = [
  { _id: 'demo-author-1', fullName: 'Nusrat Jahan', location: 'Dhanmondi, Dhaka', role: 'user' as const, verificationStatus: 'Verified' as const, rating: 4.8, reviewCount: 12, completedTasks: 8, postedTasks: 15, createdAt: new Date().toISOString() },
  { _id: 'demo-author-2', fullName: 'Mehedi Hasan', location: 'Pabna Sadar, Pabna', role: 'user' as const, verificationStatus: 'Unverified' as const, rating: 4.6, reviewCount: 9, completedTasks: 11, postedTasks: 7, createdAt: new Date().toISOString() },
  { _id: 'demo-author-3', fullName: 'Farhana Akter', location: 'Bashundhara, Dhaka', role: 'user' as const, verificationStatus: 'Verified' as const, rating: 4.9, reviewCount: 18, completedTasks: 14, postedTasks: 9, createdAt: new Date().toISOString() },
  { _id: 'demo-author-4', fullName: 'Tanvir Ahmed', location: 'Khulshi, Chattogram', role: 'user' as const, verificationStatus: 'Verified' as const, rating: 4.7, reviewCount: 7, completedTasks: 10, postedTasks: 5, createdAt: new Date().toISOString() },
  { _id: 'demo-author-5', fullName: 'Rafiul Islam', location: 'Zindabazar, Sylhet', role: 'user' as const, verificationStatus: 'Unverified' as const, rating: 4.8, reviewCount: 21, completedTasks: 25, postedTasks: 13, createdAt: new Date().toISOString() },
  { _id: 'demo-author-6', fullName: 'Sadia Rahman', location: 'Rajshahi University, Rajshahi', role: 'user' as const, verificationStatus: 'Verified' as const, rating: 4.9, reviewCount: 16, completedTasks: 9, postedTasks: 11, createdAt: new Date().toISOString() },
];

function inHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

const demoTasks: Task[] = [
  {
    _id: 'preview-dhaka-documents',
    title: 'Deliver signed documents to Dhanmondi',
    description: 'Collect a sealed envelope from the university office and deliver it to a nearby apartment. Please keep the documents dry.',
    category: 'Delivery',
    location: 'Motijheel → Dhanmondi 27, Dhaka',
    pickup: 'Motijheel, Dhaka',
    destination: 'Dhanmondi 27, Dhaka',
    deadline: inHours(30),
    budget: 650,
    status: 'Bidding',
    posterId: demoAuthors[0]._id,
    poster: demoAuthors[0],
    bidCount: 4,
    createdAt: inHours(-2),
    updatedAt: inHours(-2),
  },
  {
    _id: 'preview-pabna-parcel',
    title: 'Drop off a small parcel at New Market',
    description: 'A lightweight package needs to go from my home to a shop inside New Market before the evening rush.',
    category: 'Delivery',
    location: 'Pabna Sadar, Pabna',
    pickup: 'Pabna Sadar, Pabna',
    destination: 'Pabna New Market',
    deadline: inHours(40),
    budget: 300,
    status: 'Open',
    posterId: demoAuthors[1]._id,
    poster: demoAuthors[1],
    bidCount: 0,
    createdAt: inHours(-1),
    updatedAt: inHours(-1),
  },
  {
    _id: 'preview-grocery-shopping',
    title: 'Pick up groceries from Bashundhara',
    description: 'The shopping list is ready. Please pick up the items from the super shop and bring them to my apartment.',
    category: 'Shopping & Errands',
    location: 'Bashundhara R/A, Dhaka',
    deadline: inHours(55),
    budget: 500,
    status: 'Bidding',
    posterId: demoAuthors[2]._id,
    poster: demoAuthors[2],
    bidCount: 3,
    createdAt: inHours(-3),
    updatedAt: inHours(-3),
  },
  {
    _id: 'preview-office-filing',
    title: 'Organize and scan office paperwork',
    description: 'Sort a small stack of invoices by month, scan them as PDFs, and return the originals to the office cabinet.',
    category: 'Document & Office Work',
    location: 'Gulshan 2, Dhaka',
    deadline: inHours(72),
    budget: 900,
    status: 'Open',
    posterId: demoAuthors[3]._id,
    poster: demoAuthors[3],
    bidCount: 1,
    createdAt: inHours(-4),
    updatedAt: inHours(-4),
  },
  {
    _id: 'preview-home-cleaning',
    title: 'Help with a one-time apartment clean',
    description: 'A two-bedroom apartment needs a careful kitchen, bathroom, and balcony clean before visiting family arrive.',
    category: 'Home Services',
    location: 'Khulshi, Chattogram',
    deadline: inHours(96),
    budget: 1800,
    status: 'Bidding',
    posterId: demoAuthors[4]._id,
    poster: demoAuthors[4],
    bidCount: 5,
    createdAt: inHours(-5),
    updatedAt: inHours(-5),
  },
  {
    _id: 'preview-wifi-setup',
    title: 'Set up a home Wi-Fi router and printer',
    description: 'Connect the new router, secure the network, and help pair a wireless printer with two laptops.',
    category: 'Technology',
    location: 'Uttara Sector 7, Dhaka',
    deadline: inHours(120),
    budget: 1200,
    status: 'Open',
    posterId: demoAuthors[5]._id,
    poster: demoAuthors[5],
    bidCount: 2,
    createdAt: inHours(-6),
    updatedAt: inHours(-6),
  },
  {
    _id: 'preview-math-tutor',
    title: 'Find a Class 8 mathematics tutor',
    description: 'Looking for a patient tutor for two evening sessions focused on algebra and geometry practice.',
    category: 'Education',
    location: 'Binodpur, Rajshahi',
    deadline: inHours(144),
    budget: 800,
    status: 'Bidding',
    posterId: demoAuthors[0]._id,
    poster: demoAuthors[0],
    bidCount: 2,
    createdAt: inHours(-7),
    updatedAt: inHours(-7),
  },
  {
    _id: 'preview-event-setup',
    title: 'Set up chairs and tables for a community event',
    description: 'Help arrange chairs, a welcome table, and light refreshments at the community hall before guests arrive.',
    category: 'Others',
    location: 'Zindabazar, Sylhet',
    deadline: inHours(168),
    budget: 1400,
    status: 'Open',
    posterId: demoAuthors[2]._id,
    poster: demoAuthors[2],
    bidCount: 0,
    createdAt: inHours(-8),
    updatedAt: inHours(-8),
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [sort, setSort] = useState('newest');
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    tasksApi.list({ available: 'true' })
      .then((response) => {
        if (active) setAvailableTasks(response.data.tasks ?? []);
      })
      .catch(() => {
        if (active) setFeedError('Live tasks could not be loaded. Demo tasks are labeled and cannot receive bids.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const feedTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const area = location.trim().toLowerCase();
    const min = minBudget === '' ? undefined : Number(minBudget);
    const max = maxBudget === '' ? undefined : Number(maxBudget);
    const filtered = [...availableTasks, ...demoTasks].filter((task) => {
      const searchable = [task.title, task.description, task.category, task.location, task.pickup, task.destination]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (!selectedCategory || task.category === selectedCategory) &&
        (!query || searchable.includes(query)) &&
        (!area || task.location.toLowerCase().includes(area)) &&
        (min === undefined || task.budget >= min) &&
        (max === undefined || task.budget <= max);
    });
    return filtered.sort((left, right) => {
      if (sort === 'budget-low') return left.budget - right.budget;
      if (sort === 'budget-high') return right.budget - left.budget;
      if (sort === 'deadline') return new Date(left.deadline).getTime() - new Date(right.deadline).getTime();
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [availableTasks, location, maxBudget, minBudget, search, selectedCategory, sort]);

  const handleTaskCreated = (task: Task) => {
    setAvailableTasks((current) => [task, ...current.filter((item) => item._id !== task._id)]);
    setSelectedCategory('');
    setSearch('');
    setLocation('');
    setMinBudget('');
    setMaxBudget('');
    setSort('newest');
    setComposerOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-140 px-3 py-3 sm:px-0">
      <section className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        {!composerOpen ? (
          <button type="button" onClick={() => setComposerOpen(true)} className="flex w-full items-center gap-3 text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{user?.fullName.charAt(0)}</div>
            <span className="flex h-9 flex-1 items-center rounded-full bg-slate-100 px-4 text-sm text-slate-500">Share a task or ask for local help...</span>
          </button>
        ) : (
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-extrabold text-slate-900">Create a task</h2>
            <button type="button" onClick={() => setComposerOpen(false)} className="rounded-full px-3 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
          </div>
        )}
        {composerOpen ? (
          <div className="pt-3"><TaskComposer compact onCreated={handleTaskCreated} /></div>
        ) : (
          <div className="mt-2.5 flex border-t border-slate-100 pt-2 text-xs font-semibold text-slate-600">
            <span className="flex flex-1 items-center justify-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-orange-500" /> Task</span>
            <span className="flex flex-1 items-center justify-center gap-2"><span className="font-bold text-emerald-600">৳</span> Budget</span>
            <span className="flex flex-1 items-center justify-center gap-2"><ImageIcon className="h-4 w-4 text-blue-500" /> Photos</span>
          </div>
        )}
      </section>

      <section className="mb-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button type="button" onClick={() => setSelectedCategory('')} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${!selectedCategory ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All Tasks</button>
          {categories.map((category) => (
            <button key={category} type="button" onClick={() => setSelectedCategory(category)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${selectedCategory === category ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{category}</button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input aria-label="Search tasks" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-orange-400" />
          </label>
          <input aria-label="Filter by location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400" />
          <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-500">
            <ListFilter className="h-4 w-4 shrink-0" />
            <select aria-label="Sort tasks" value={sort} onChange={(event) => setSort(event.target.value)} className="min-w-0 bg-transparent text-xs font-semibold text-slate-700 outline-none">
              <option value="newest">Newest</option>
              <option value="deadline">Soonest deadline</option>
              <option value="budget-high">Budget: high to low</option>
              <option value="budget-low">Budget: low to high</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:col-span-3 sm:grid-cols-[1fr_1fr_auto]">
            <input aria-label="Minimum budget" type="number" min="0" value={minBudget} onChange={(event) => setMinBudget(event.target.value)} placeholder="Min budget (৳)" className="h-9 min-w-0 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-orange-400" />
            <input aria-label="Maximum budget" type="number" min="0" value={maxBudget} onChange={(event) => setMaxBudget(event.target.value)} placeholder="Max budget (৳)" className="h-9 min-w-0 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-orange-400" />
            <Link href="/my-tasks/posted" className="col-span-2 flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 sm:col-span-1">My Tasks</Link>
          </div>
        </div>
      </section>

      {feedError && <p role="status" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{feedError}</p>}
      {loading && <LoadingSpinner className="min-h-16 py-4" />}
      <div className="space-y-3">
        {feedTasks.map((task) => <TaskCard key={task._id} task={task} />)}
        {!feedTasks.length && !loading && (
          <div className="rounded-lg border border-slate-200 bg-white px-5 py-7 text-center">
            <p className="text-sm font-bold text-slate-800">No tasks match these filters</p>
            <p className="mt-1 text-xs text-slate-500">Try another category, location, or budget range.</p>
          </div>
        )}
      </div>
    </div>
  );
}
