'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CalendarDays, Camera, CheckCircle2, DollarSign, ImagePlus,
  Bike, CarFront, MapPin, MessageSquare, Send, ShieldCheck, Star, Users, WalletCards,
} from 'lucide-react';
import {
  bidsApi, dashboardApi, messagesApi, notificationsApi, paymentsApi, reviewsApi, ridesApi, tasksApi,
  usersApi,
  uploadsApi,
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/Card';
import TaskCard from '../components/TaskCard';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import StoreMarketplacePage from './StoreMarketplacePage';
import { formatCurrency, formatDate, formatDateTime, getInitials, timeAgo } from '../utils/format';
import { TASK_CATEGORIES, type Bid, type CloudinaryAsset, type Message, type Ride, type RideRequest, type Task } from '../types';

function PageHeading({ title, description }: { title: string; description?: string }) {
  return <div className="mb-5"><h1 className="text-2xl font-extrabold text-slate-950">{title}</h1>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>;
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-3 font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{detail}</p></div>;
}

export default function MarketplaceRoutePage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, updateUser } = useAuth();
  const route = pathname.replace(/\/+$/, '');

  if (route === '/tasks' || route === '/marketplace') return <TasksPage />;
  if (route === '/post-task') return <PostTaskPage />;
  if (route === '/my-tasks') return <MyTasksPage />;
  if (route === '/my-tasks/posted' || route === '/my-tasks/accepted') return <MyTasksPage />;
  if (route === '/categories') return <CategoriesPage />;
  if (route === '/saved') return <SavedTasksPage />;
  if (route === '/messages') return <MessagesPage
    listingId={searchParams.get('listing') || undefined}
    otherUserId={searchParams.get('user') || undefined}
  />;
  if (/^\/chat\/[^/]+$/.test(route)) return <MessagesPage taskId={route.split('/').pop()} />;
  if (route === '/notifications') return <NotificationsPage />;
  if (route === '/payments') return <PaymentsPage />;
  if (route === '/reviews') return <ReviewsPage />;
  if (route === '/profile') return <ProfilePage user={user} updateUser={updateUser} />;
  if (route === '/settings') return <SettingsPage />;
  if (route === '/help') return <HelpPage />;
  if (route === '/privacy') return <PrivacyPage />;
  if (route === '/store') return <StoreMarketplacePage />;
  if (route === '/rides') return <RideBookingPage />;
  if (/^\/tasks\/[^/]+$/.test(route)) return <TaskDetailPage taskId={route.split('/').pop()!} />;
  return <Empty title="Page not found" detail="Choose a destination from the navigation." />;
}

function TasksPage() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      const res = await tasksApi.list(params);
      setTasks(res.data.tasks);
    } catch {
      setError('Tasks could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="mx-auto max-w-5xl px-3 py-5">
      <PageHeading title="Browse tasks" description="Find real opportunities near you." />
      <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row">
        <label className="relative flex-1"><DollarSign className="absolute left-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void load()} placeholder="Search tasks by title, description, or location" className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-orange-400" /></label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm"><option value="">All categories</option>{TASK_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
        <Button onClick={() => void load()}>Search</Button>
      </div>
      {loading ? <LoadingSpinner /> : error ? <Empty title="Unable to load tasks" detail={error} /> : tasks.length ? <div className="grid gap-4 md:grid-cols-2">{tasks.map((task) => <TaskCard key={task._id} task={task} />)}</div> : <Empty title="No matching tasks" detail="Try broadening your search or category." />}
    </div>
  );
}

function PostTaskPage() {
  const router = useRouter();
  const [form, setForm] = useState<{ title: string; description: string; category: string; location: string; deadline: string; budget: string; additionalInstructions: string; attachments: string[]; attachmentAssets: CloudinaryAsset[] }>({ title: '', description: '', category: TASK_CATEGORIES[0], location: '', deadline: '', budget: '', additionalInstructions: '', attachments: [], attachmentAssets: [] });
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const selectPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || []);
    event.target.value = '';
    if (form.attachments.length + photos.length + incoming.length > 5) {
      toast.error('Add no more than five photos to a task.');
      return;
    }
    if (incoming.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024)) {
      toast.error('Photos must be JPG, PNG, or WebP files no larger than 4 MB each.');
      return;
    }
    setPhotos((current) => [...current, ...incoming]);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    if (!form.title.trim() || !form.description.trim() || !form.location.trim() || !form.deadline || !form.budget) {
      toast.error('Complete the title, description, location, deadline, and budget fields.');
      setSaving(false);
      return;
    }
    const budget = Number(form.budget);
    const deadline = new Date(`${form.deadline}T23:59:59`);
    if (!Number.isFinite(budget) || budget < 1) {
      toast.error('Budget must be at least ৳1.');
      setSaving(false);
      return;
    }
    if (Number.isNaN(deadline.getTime())) {
      toast.error('Choose a valid deadline.');
      setSaving(false);
      return;
    }
    try {
      const attachmentAssets: CloudinaryAsset[] = [];
      for (const [index, file] of photos.entries()) {
        const response = await uploadsApi.upload(file, 'task-attachment', (progress) => {
          setUploadProgress(Math.round(((index + progress / 100) / photos.length) * 100));
        });
        attachmentAssets.push(response.data.asset as CloudinaryAsset);
      }
      await tasksApi.create({
        ...form,
        attachments: [...form.attachments, ...attachmentAssets.map((asset) => asset.url)],
        attachmentAssets: [...form.attachmentAssets, ...attachmentAssets],
        budget,
        deadline: deadline.toISOString(),
      });
      toast.success('Task posted');
      router.push('/my-tasks/posted');
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to post task');
    } finally { setSaving(false); setUploadProgress(0); }
  };
  return (
    <div className="mx-auto max-w-2xl px-3 py-5">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-slate-500"><ArrowLeft className="h-4 w-4" /> Home</Link>
      <PageHeading title="Post a task" description="Tell local taskers what needs to be done." />
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Input required label="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Pick up groceries" />
        <Textarea required label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
        <div className="grid gap-4 sm:grid-cols-2"><Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={TASK_CATEGORIES.map((item) => ({ value: item, label: item }))} /><Input required label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><Input required label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /><Input required label="Budget (৳)" type="number" min="1" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
        <Textarea label="Additional instructions" value={form.additionalInstructions} onChange={(e) => setForm({ ...form, additionalInstructions: e.target.value })} rows={3} />
        <div className="space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ImagePlus className="h-4 w-4" /> Add photos <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={selectPhotos} /></label>
          {!!photos.length && <ul className="space-y-1 text-xs text-slate-500">{photos.map((photo, index) => <li key={`${photo.name}-${index}`} className="flex items-center justify-between gap-2"><span className="truncate">{photo.name}</span><button type="button" className="font-bold text-red-600" onClick={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></li>)}</ul>}
        </div>
        <Button type="submit" loading={saving} className="w-full"><Send className="h-4 w-4" /> {saving ? `Uploading ${uploadProgress}%` : 'Publish task'}</Button>
      </form>
    </div>
  );
}

function MyTasksPage() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const kind = pathname.endsWith('/accepted') ? 'accepted' : pathname.endsWith('/posted') ? 'posted' : '';
  const previewTasks = [
    { _id: 'preview-my-home-cleaning', title: 'Deep clean a two-bedroom apartment', description: 'Kitchen, bathroom, balcony, and living room need a complete clean before Friday evening.', category: 'Cleaning', location: 'Uttara, Dhaka', deadline: '2026-11-06T18:00:00.000Z', budget: 1800, status: 'Bidding', posterId: user?._id || 'preview-me', poster: user, bidCount: 4, createdAt: '2026-11-03T08:00:00.000Z', updatedAt: '2026-11-03T08:00:00.000Z' },
    { _id: 'preview-my-phone-sale', title: 'Help photograph items for an online listing', description: 'Three household items need clear photos and short descriptions for a second-hand marketplace.', category: 'Photography & Media', location: 'Mirpur 10, Dhaka', deadline: '2026-11-09T14:00:00.000Z', budget: 700, status: 'Open', posterId: user?._id || 'preview-me', poster: user, bidCount: 2, createdAt: '2026-11-02T10:00:00.000Z', updatedAt: '2026-11-02T10:00:00.000Z' },
    { _id: 'preview-my-event-decor', title: 'Arrange birthday decorations in Gulshan', description: 'Set up balloons, a backdrop, and a small gift table for a family birthday celebration.', category: 'Event Help', location: 'Gulshan 1, Dhaka', deadline: '2026-11-08T16:00:00.000Z', budget: 1500, status: 'Assigned', posterId: user?._id || 'preview-me', poster: user, bidCount: 3, createdAt: '2026-11-02T08:00:00.000Z', updatedAt: '2026-11-02T08:00:00.000Z' },
    { _id: 'preview-my-cables', title: 'Organize office cables and workstation setup', description: 'Label cables and arrange four desks neatly before the new office team arrives Monday morning.', category: 'Office Work', location: 'Mohakhali, Dhaka', deadline: '2026-11-10T11:00:00.000Z', budget: 950, status: 'Open', posterId: user?._id || 'preview-me', poster: user, bidCount: 1, createdAt: '2026-11-01T09:00:00.000Z', updatedAt: '2026-11-01T09:00:00.000Z' },
  ] as Task[];
  const acceptedPreviewTasks = [
    { _id: 'preview-accepted-delivery', title: 'Deliver documents from Motijheel to Banani', description: 'Collect the signed office documents and deliver them to the client office before lunch.', category: 'Document Delivery', location: 'Motijheel to Banani, Dhaka', deadline: '2026-11-05T13:00:00.000Z', budget: 450, status: 'In Progress', posterId: 'preview-poster-1', bidCount: 3, workerId: user?._id, createdAt: '2026-11-03T07:00:00.000Z', updatedAt: '2026-11-03T09:00:00.000Z' },
    { _id: 'preview-accepted-grocery', title: 'Weekly grocery pickup in Uttara', description: 'Purchase the listed groceries and deliver them to a nearby apartment this afternoon.', category: 'Shopping & Errands', location: 'Uttara, Dhaka', deadline: '2026-11-06T17:00:00.000Z', budget: 600, status: 'Assigned', posterId: 'preview-poster-2', bidCount: 2, workerId: user?._id, createdAt: '2026-11-02T12:00:00.000Z', updatedAt: '2026-11-02T15:00:00.000Z' },
    { _id: 'preview-accepted-furniture', title: 'Assemble a small study desk', description: 'Assemble a flat-pack study desk and place it beside the bedroom window.', category: 'Home Repair', location: 'Savar, Dhaka', deadline: '2026-11-09T15:00:00.000Z', budget: 850, status: 'Assigned', posterId: 'preview-poster-3', bidCount: 4, workerId: user?._id, createdAt: '2026-11-01T10:00:00.000Z', updatedAt: '2026-11-01T14:00:00.000Z' },
  ] as Task[];

  useEffect(() => {
    setLoading(true);
    const request = kind
      ? tasksApi.list({ mine: kind })
      : dashboardApi.get().then((res) => ({ data: { tasks: [...res.data.recentPosted, ...res.data.recentAccepted] } }));
    request.then((res) => setTasks(res.data.tasks.length ? res.data.tasks : kind === 'accepted' ? acceptedPreviewTasks : previewTasks))
      .finally(() => setLoading(false));
  }, [kind, previewTasks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const title = kind === 'accepted' ? 'Accepted tasks' : kind === 'posted' ? 'Posted tasks' : 'My tasks';
  return (
    <div className="mx-auto max-w-5xl px-3 py-5">
      <PageHeading title={title} description="Manage work you posted and work assigned to you." />
      <Link href="/post-task" className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">{user?.fullName.charAt(0)}</div>
        <div className="flex h-11 flex-1 items-center rounded-full bg-slate-100 px-5 text-sm text-slate-500">What task needs doing?</div>
        <span className="hidden rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white sm:block">Post task</span>
      </Link>
      <div className="mb-5 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
        {[['/my-tasks', 'Overview'], ['/my-tasks/posted', 'Posted'], ['/my-tasks/accepted', 'Accepted']].map(([href, label]) => (
          <Link key={href} href={href} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold ${pathname === href ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{label}</Link>
        ))}
      </div>
      {loading ? <LoadingSpinner /> : tasks.length ? <div className="grid gap-4 md:grid-cols-2">{tasks.map((task) => <TaskCard key={task._id} task={task} />)}</div> : <Empty title={`No ${kind || ''} tasks yet`} detail="Tasks you post or accept will appear here." />}
    </div>
  );
}

function TaskDetailPage({ taskId }: { taskId: string }) {
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bid, setBid] = useState({ amount: '', message: '', estimatedCompletion: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const taskRes = await tasksApi.get(taskId);
      setTask(taskRes.data.task);
      if (taskRes.data.task.posterId === user?._id) {
        const bidsRes = await bidsApi.getByTask(taskId);
        setBids(bidsRes.data.bids);
      }
    } catch {
      toast.error('Unable to load this task');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitBid = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await bidsApi.create({ taskId, amount: Number(bid.amount), message: bid.message, estimatedCompletion: bid.estimatedCompletion });
      toast.success('Bid submitted');
      setBid({ amount: '', message: '', estimatedCompletion: '' });
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to submit bid');
    } finally { setSaving(false); }
  };

  const acceptBid = async (bidId: string) => {
    try {
      await bidsApi.accept(bidId);
      toast.success('Bid accepted and worker assigned');
      await load();
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to accept bid');
    }
  };

  const updateStatus = async (status: string) => {
    try {
      await tasksApi.updateStatus(taskId, { status });
      toast.success(`Task status updated to ${status}`);
      await load();
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to update task');
    }
  };

  if (loading) return <LoadingSpinner className="min-h-[60vh]" />;
  if (!task) return <div className="mx-auto max-w-3xl p-5"><Empty title="Task not found" detail="This task may have been removed." /></div>;

  const isPoster = task.posterId === user?._id;
  const isWorker = task.workerId === user?._id;

  return (
    <div className="mx-auto max-w-3xl px-3 py-5">
      <Link href="/tasks" className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-slate-500"><ArrowLeft className="h-4 w-4" /> Back to tasks</Link>
      <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-xs font-bold text-orange-600">{task.category}</span><h1 className="mt-1 text-2xl font-extrabold text-slate-950">{task.title}</h1></div><p className="text-2xl font-extrabold text-orange-600">{formatCurrency(task.budget)}</p></div>
          <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-500" />{task.location}</span><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-orange-500" />{formatDate(task.deadline)}</span><span className="flex items-center gap-2"><Users className="h-4 w-4 text-orange-500" />{task.bidCount ?? bids.length} bids</span></div>
        </div>
        <div className="p-5"><h2 className="font-bold text-slate-900">Task details</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{task.description}</p>{!!task.attachments?.length && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{task.attachments.map((src) => <Image key={src} src={src} alt={`Photo for ${task.title}`} width={320} height={240} className="h-36 w-full rounded-lg object-cover" unoptimized />)}</div>}{task.additionalInstructions && <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><strong className="text-slate-900">Additional instructions:</strong> {task.additionalInstructions}</p>}</div>
      </article>

      {isPoster && ['Open', 'Bidding'].includes(task.status) && (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-extrabold text-slate-950">Received bids</h2>{bids.length ? <div className="mt-3 space-y-3">{bids.map((item) => <div key={item._id} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><div><p className="font-bold">{item.bidder?.fullName || 'TaskAnt member'}</p><p className="text-xs text-slate-500">{item.estimatedCompletion}</p></div><strong className="text-orange-600">{formatCurrency(item.amount)}</strong></div><p className="mt-2 text-sm text-slate-600">{item.message}</p>{item.status === 'Pending' && <Button size="sm" className="mt-3" onClick={() => void acceptBid(item._id)}>Accept bid</Button>}</div>)}</div> : <p className="mt-3 text-sm text-slate-500">No bids received yet.</p>}</section>
      )}

      {!isPoster && ['Open', 'Bidding'].includes(task.status) && (
        <form onSubmit={submitBid} className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-extrabold text-slate-950">Submit your bid</h2><div className="grid gap-3 sm:grid-cols-2"><Input required type="number" min="1" label="Your offer (৳)" value={bid.amount} onChange={(e) => setBid({ ...bid, amount: e.target.value })} /><Input required label="Estimated completion" value={bid.estimatedCompletion} onChange={(e) => setBid({ ...bid, estimatedCompletion: e.target.value })} /></div><Textarea required label="How you'll complete it" value={bid.message} onChange={(e) => setBid({ ...bid, message: e.target.value })} /><Button type="submit" loading={saving}>Submit bid</Button></form>
      )}

      {isWorker && task.status === 'Assigned' && <Button className="mt-4" onClick={() => void updateStatus('In Progress')}>Start task</Button>}
      {isWorker && task.status === 'In Progress' && <Button className="mt-4" onClick={() => void updateStatus('Completed')}>Mark completed</Button>}
      {(isPoster || isWorker) && task.workerId && <Link href={`/chat/${taskId}`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"><MessageSquare className="h-4 w-4" /> Open task chat</Link>}
    </div>
  );
}

function CategoriesPage() {
  return <div className="mx-auto max-w-5xl px-3 py-5"><PageHeading title="Categories" description="Explore work by skill and service area." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{TASK_CATEGORIES.map((category, index) => <Link key={category} href={`/tasks?category=${encodeURIComponent(category)}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 font-extrabold text-orange-600">{index + 1}</span><h2 className="mt-4 font-extrabold text-slate-900 group-hover:text-orange-600">{category}</h2><p className="mt-1 text-xs text-slate-500">Browse available tasks</p></Link>)}</div></div>;
}

function SavedTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    const key = `taskant_saved_${user._id}`;
    let saved: string[] = [];
    try { saved = JSON.parse(localStorage.getItem(key) || '[]') as string[]; } catch { saved = []; }
    if (!saved.length) { setLoading(false); return; }
    tasksApi.list().then((res) => setTasks(res.data.tasks.filter((task: Task) => saved.includes(task._id)))).finally(() => setLoading(false));
  }, [user]);
  return <div className="mx-auto max-w-5xl px-3 py-5"><PageHeading title="Saved tasks" description="Tasks saved on this device." />{loading ? <LoadingSpinner /> : tasks.length ? <div className="grid gap-4 md:grid-cols-2">{tasks.map((task) => <TaskCard key={task._id} task={task} />)}</div> : <Empty title="No saved tasks" detail="Saved tasks will appear here." />}</div>;
}

function NotificationsPage() {
  const [items, setItems] = useState<Array<{ _id: string; title: string; message: string; read: boolean; createdAt: string; link?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const load = () => notificationsApi.list().then((res) => setItems(res.data.notifications)).finally(() => setLoading(false));
  useEffect(() => { void load(); }, []);
  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setItems((current) => current.map((item) => item._id === id ? { ...item, read: true } : item));
  };
  const markAll = async () => { await notificationsApi.markAllRead(); setItems((current) => current.map((item) => ({ ...item, read: true }))); };
  return <div className="mx-auto max-w-3xl px-3 py-5"><div className="mb-5 flex items-end justify-between"><PageHeading title="Notifications" /><Button variant="ghost" size="sm" onClick={() => void markAll()}>Mark all read</Button></div>{loading ? <LoadingSpinner /> : items.length ? <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{items.map((item) => <button key={item._id} onClick={() => void markRead(item._id)} className={`block w-full border-b border-slate-100 px-5 py-4 text-left last:border-0 ${item.read ? 'bg-white' : 'bg-orange-50/60'}`}><div className="flex justify-between gap-3"><p className="font-bold text-slate-900">{item.title}</p><span className="text-xs text-slate-400">{timeAgo(item.createdAt)}</span></div><p className="mt-1 text-sm text-slate-600">{item.message}</p>{item.link && <Link href={item.link} className="mt-2 inline-block text-xs font-bold text-orange-600">View details</Link>}</button>)}</div> : <Empty title="You're all caught up" detail="New task and account activity will appear here." />}</div>;
}

function PaymentsPage() {
  const [payments, setPayments] = useState<Array<{ _id: string; taskTitle?: string; amount: number; total: number; status: string; method: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { paymentsApi.list().then((res) => setPayments(res.data.payments)).finally(() => setLoading(false)); }, []);
  return <div className="mx-auto max-w-4xl px-3 py-5"><PageHeading title="Payments" description="Demo payments are recorded through the existing TaskAnt API." />{loading ? <LoadingSpinner /> : payments.length ? <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{payments.map((payment) => <div key={payment._id} className="flex items-center gap-4 border-b border-slate-100 p-4 last:border-0"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600"><WalletCards className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900">{payment.taskTitle || 'Task payment'}</p><p className="text-xs text-slate-500">{payment.method} · {formatDate(payment.createdAt)}</p></div><div className="text-right"><p className="font-extrabold text-slate-900">{formatCurrency(payment.total)}</p><p className="text-xs text-green-600">{payment.status}</p></div></div>)}</div> : <Empty title="No payments yet" detail="Completed task payments will appear here." />}</div>;
}

function MessagesPage({
  taskId,
  listingId,
  otherUserId,
}: {
  taskId?: string;
  listingId?: string;
  otherUserId?: string;
}) {
  const { token, user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Array<{
    type: 'task' | 'listing';
    taskId?: string;
    listingId?: string;
    otherUserId?: string;
    taskTitle: string;
    otherUser: { fullName: string } | null;
    unread: number;
  }>>([]);
  const [selected, setSelected] = useState(taskId || '');
  const [selectedListingId, setSelectedListingId] = useState(listingId || '');
  const [selectedOtherUserId, setSelectedOtherUserId] = useState(otherUserId || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [messagePhoto, setMessagePhoto] = useState<CloudinaryAsset | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (listingId && otherUserId) {
      setSelected('');
      setSelectedListingId(listingId);
      setSelectedOtherUserId(otherUserId);
    } else if (taskId) {
      setSelected(taskId);
      setSelectedListingId('');
      setSelectedOtherUserId('');
    }
  }, [listingId, otherUserId, taskId]);

  const loadMessages = useCallback(async (id: string, listing: string, other: string) => {
    const res = listing
      ? await messagesApi.getByListing(listing, other)
      : await messagesApi.getByTask(id);
    setMessages(res.data.messages);
  }, []);
  useEffect(() => {
    messagesApi.getConversations().then((res) => {
      setConversations(res.data.conversations);
      if (!taskId && !listingId && res.data.conversations[0]) {
        const first = res.data.conversations[0];
        if (first.type === 'listing' && first.listingId) {
          setSelectedListingId(first.listingId);
          setSelectedOtherUserId(first.otherUserId || '');
        } else if (first.taskId) {
          setSelected(first.taskId);
        }
      }
    }).catch(() => {
      toast.error('Conversations could not be loaded.');
    }).finally(() => setLoading(false));
  }, [listingId, taskId]);
  useEffect(() => {
    if (selectedListingId && selectedOtherUserId) {
      void loadMessages('', selectedListingId, selectedOtherUserId).catch(() => toast.error('Messages could not be loaded.'));
    } else if (selected) {
      void loadMessages(selected, '', '').catch(() => toast.error('Messages could not be loaded.'));
    }
  }, [loadMessages, selected, selectedListingId, selectedOtherUserId]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim() && !messagePhoto) return;
    try {
      if (selectedListingId) {
        await messagesApi.sendStore({
          listingId: selectedListingId,
          receiverId: selectedOtherUserId,
          content: text.trim(),
          ...(messagePhoto && { attachment: messagePhoto.url, attachmentPublicId: messagePhoto.publicId }),
        });
      } else {
        await messagesApi.send({
          taskId: selected,
          content: text.trim(),
          ...(messagePhoto && { attachment: messagePhoto.url, attachmentPublicId: messagePhoto.publicId }),
        });
      }
      setText('');
      setMessagePhoto(null);
      await loadMessages(selected, selectedListingId, selectedOtherUserId);
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to send message');
    }
  };
  const selectMessagePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) {
      toast.error('Choose a JPG, PNG, or WebP image no larger than 4 MB.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const response = await uploadsApi.upload(file, 'chat-attachment', setUploadProgress);
      setMessagePhoto(response.data.asset as CloudinaryAsset);
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Image upload failed.');
    } finally {
      setUploadingPhoto(false);
      setUploadProgress(0);
    }
  };

  const hasSelection = Boolean(selected || (selectedListingId && selectedOtherUserId));
  return <div className="mx-auto max-w-5xl px-3 py-5"><PageHeading title="Messages" description={token ? 'Messages with your TaskAnt community.' : ''} /><div className="grid min-h-130 overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-[280px_1fr]">{loading ? <LoadingSpinner /> : <><div className="border-b border-slate-200 md:border-b-0 md:border-r">{conversations.length ? conversations.map((conversation) => {
    const key = conversation.type === 'listing'
      ? `listing:${conversation.listingId}:${conversation.otherUserId}`
      : `task:${conversation.taskId}`;
    const active = conversation.type === 'listing'
      ? selectedListingId === conversation.listingId && selectedOtherUserId === conversation.otherUserId
      : selected === conversation.taskId && !selectedListingId;
    return <button key={key} onClick={() => {
      if (conversation.type === 'listing' && conversation.listingId) {
        setSelected('');
        setSelectedListingId(conversation.listingId);
        setSelectedOtherUserId(conversation.otherUserId || '');
        router.push(`/messages?listing=${conversation.listingId}&user=${conversation.otherUserId}`);
      } else if (conversation.taskId) {
        setSelectedListingId('');
        setSelectedOtherUserId('');
        setSelected(conversation.taskId);
        router.push(`/chat/${conversation.taskId}`);
      }
    }} className={`w-full border-b border-slate-100 p-4 text-left ${active ? 'bg-orange-50' : 'hover:bg-slate-50'}`}><p className="truncate text-sm font-bold text-slate-900">{conversation.otherUser?.fullName || 'Task participant'}</p><p className="truncate text-xs text-slate-500">{conversation.taskTitle}{conversation.type === 'listing' ? ' · Marketplace' : ''}</p></button>;
  }) : <p className="p-5 text-sm text-slate-500">Your task and marketplace conversations will appear here.</p>}</div><div className="flex min-h-105 flex-col">{hasSelection ? <><div className="flex-1 space-y-3 overflow-y-auto p-4">{messages.map((message) => <div key={message._id} className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${message.senderId === user?._id ? 'ml-auto bg-orange-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{message.attachment && <Image src={message.attachment} alt="Message attachment" width={320} height={240} className="mb-2 max-h-60 w-auto rounded-lg object-contain" unoptimized />}<p>{message.content}</p><span className={`mt-1 block text-[10px] ${message.senderId === user?._id ? 'text-orange-100' : 'text-slate-400'}`}>{timeAgo(message.createdAt)}</span></div>)}</div><form onSubmit={send} className="flex flex-wrap items-center gap-2 border-t border-slate-100 p-3">{messagePhoto && <div className="flex w-full items-center gap-2 text-xs text-slate-500"><Image src={messagePhoto.url} alt="Selected attachment" width={40} height={40} className="h-10 w-10 rounded object-cover" unoptimized />Ready to send <button type="button" onClick={() => setMessagePhoto(null)} className="font-bold text-red-600">Remove</button></div>}<label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" title={uploadingPhoto ? `Uploading ${uploadProgress}%` : 'Attach image'}><Camera className="h-5 w-5" /><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void selectMessagePhoto(event)} disabled={uploadingPhoto} /></label>{uploadingPhoto && <span className="text-xs text-slate-500">Uploading {uploadProgress}%</span>}<input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." className="h-10 min-w-0 flex-1 rounded-full bg-slate-100 px-4 text-sm outline-none focus:ring-2 focus:ring-orange-200" /><button disabled={uploadingPhoto || (!text.trim() && !messagePhoto)} className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button></form></> : <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Select a conversation.</div>}</div></>}</div></div>;
}

function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Array<{ _id: string; rating: number; comment: string; reviewer?: { fullName: string }; taskTitle?: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (user?._id) reviewsApi.getByUser(user._id).then((res) => setReviews(res.data.reviews)).finally(() => setLoading(false)); }, [user]);
  return <div className="mx-auto max-w-3xl px-3 py-5"><PageHeading title="Reviews" description="Feedback from your completed tasks." /><div className="mb-4 rounded-2xl bg-slate-950 p-5 text-white"><div className="flex items-center gap-3"><Star className="h-8 w-8 fill-orange-500 text-orange-500" /><div><p className="text-2xl font-extrabold">{user?.rating.toFixed(1)}</p><p className="text-xs text-slate-400">{user?.reviewCount || 0} reviews</p></div></div></div>{loading ? <LoadingSpinner /> : reviews.length ? <div className="space-y-3">{reviews.map((review) => <article key={review._id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex justify-between"><div><p className="font-bold text-slate-900">{review.reviewer?.fullName || 'TaskAnt member'}</p><p className="text-xs text-slate-500">{review.taskTitle}</p></div><span className="flex items-center gap-1 text-sm font-bold text-orange-600"><Star className="h-4 w-4 fill-orange-500" />{review.rating}</span></div><p className="mt-3 text-sm text-slate-600">{review.comment}</p></article>)}</div> : <Empty title="No reviews yet" detail="Reviews are added after completed and reviewed tasks." />}</div>;
}

function ProfilePage({ user, updateUser }: { user: ReturnType<typeof useAuth>['user']; updateUser: ReturnType<typeof useAuth>['updateUser'] }) {
  const [form, setForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '', location: user?.location || '', bio: user?.bio || '' });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoAsset, setPhotoAsset] = useState<CloudinaryAsset | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const photoFields = photoAsset
        ? { profilePhoto: photoAsset.url, profilePhotoPublicId: photoAsset.publicId }
        : removePhoto ? { profilePhoto: '', profilePhotoPublicId: '' } : {};
      const res = await usersApi.updateProfile({ ...form, ...photoFields });
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to update profile');
    } finally { setSaving(false); }
  };
  const selectPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) {
      toast.error('Choose a JPG, PNG, or WebP image no larger than 4 MB.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const response = await uploadsApi.upload(file, 'profile-photo');
      setPhotoAsset(response.data.asset as CloudinaryAsset);
      setRemovePhoto(false);
      toast.success('Profile photo uploaded');
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Profile photo upload failed.');
    } finally { setUploadingPhoto(false); }
  };
  const photoUrl = removePhoto ? '' : photoAsset?.url || user?.profilePhoto;
  return <div className="mx-auto max-w-2xl px-3 py-5"><PageHeading title="Profile" description="Your public TaskAnt identity." /><form onSubmit={save} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-4 border-b border-slate-100 pb-5"><div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-950 text-xl font-extrabold text-white">{photoUrl ? <Image src={photoUrl} alt="Profile photo" fill sizes="64px" className="object-cover" unoptimized /> : user?.fullName.charAt(0)}</div><div><p className="font-extrabold text-slate-950">{user?.fullName}</p><p className="text-sm text-slate-500">{user?.location}</p><p className="mt-1 text-xs font-bold text-orange-600">{user?.rating.toFixed(1)} rating · {user?.completedTasks || 0} completed tasks</p><div className="mt-2 flex gap-3"><label className="cursor-pointer text-xs font-bold text-orange-600">{uploadingPhoto ? 'Uploading…' : 'Change photo'}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void selectPhoto(event)} disabled={uploadingPhoto} /></label>{photoUrl && <button type="button" className="text-xs font-semibold text-slate-500" onClick={() => { setPhotoAsset(null); setRemovePhoto(true); }}>Remove</button>}</div></div></div><Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /><div className="grid gap-4 sm:grid-cols-2"><Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div><Textarea label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /><Button loading={saving} type="submit">Save profile</Button></form></div>;
}

function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  return <div className="mx-auto max-w-2xl px-3 py-5"><PageHeading title="Settings" description="Manage local preferences for this account." /><div className="rounded-2xl border border-slate-200 bg-white"><label className="flex items-center justify-between border-b border-slate-100 p-5"><span><strong className="block text-sm text-slate-900">Task and message alerts</strong><span className="text-xs text-slate-500">Preference stored on this device</span></span><input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} /></label><div className="p-5 text-sm text-slate-600"><strong className="text-slate-900">Account security</strong><p className="mt-1">Password changes are handled by account administration in the current backend.</p></div></div></div>;
}

function HelpPage() {
  return <div className="mx-auto max-w-3xl px-3 py-5"><PageHeading title="Help center" description="Common questions about posting, bidding, and completing tasks." /><div className="space-y-3">{[
    ['How do I post a task?', 'Open “Post a task,” add the work details, budget, location, and deadline, then publish it to the marketplace.'],
    ['How do bids work?', 'Other members submit offers. You can review and accept a bid from your task detail page, which assigns the worker and enables task messaging.'],
    ['How does task progress work?', 'The assigned worker can start and complete a task. Completion must then be handled through the existing payment flow.'],
    ['Can I both post and accept work?', 'Yes. TaskAnt uses one account for posting and accepting tasks; your account cannot bid on work you posted yourself.'],
  ].map(([question, answer]) => <details key={question} className="rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-bold text-slate-900">{question}</summary><p className="mt-3 text-sm leading-6 text-slate-600">{answer}</p></details>)}</div></div>;
}

function RideBookingPage() {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [sampleRides, setSampleRides] = useState<Ride[]>([]);
  const [requestedRideIds, setRequestedRideIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [requestingRideId, setRequestingRideId] = useState('');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [form, setForm] = useState({
    pickup: '',
    destination: '',
    vehicleType: 'Car',
    departureAt: '',
    availableSeats: '3',
    fare: '',
    description: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ridesResponse, requestsResponse] = await Promise.all([
        ridesApi.list(),
        ridesApi.myRequests(),
      ]);
      setRides(ridesResponse.data.rides);
      setRequestedRideIds(requestsResponse.data.requests.map((request: RideRequest) => request.rideId));
    } catch {
      setError('Available rides could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setSampleRides(createSampleRides()); }, []);

  const submitRide = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    if (!form.pickup.trim() || !form.destination.trim() || !form.departureAt || !form.fare) {
      toast.error('Complete the pickup, destination, departure, and fare fields.');
      setSaving(false);
      return;
    }
    const departureAt = new Date(form.departureAt);
    const fare = Number(form.fare);
    const availableSeats = Number(form.availableSeats);
    if (!Number.isFinite(departureAt.getTime()) || departureAt <= new Date()) {
      toast.error('Choose a future departure date and time.');
      setSaving(false);
      return;
    }
    if (!Number.isFinite(fare) || fare < 1 || fare > 100000) {
      toast.error('Fare must be between ৳1 and ৳100,000.');
      setSaving(false);
      return;
    }
    if (!Number.isInteger(availableSeats) || availableSeats < 1 || availableSeats > 8) {
      toast.error('Choose between 1 and 8 available seats.');
      setSaving(false);
      return;
    }
    try {
      const response = await ridesApi.create({
        ...form,
        pickup: form.pickup.trim(),
        destination: form.destination.trim(),
        departureAt: departureAt.toISOString(),
        availableSeats,
        fare,
      });
      setRides((current) => [...current, response.data.ride].sort(
        (left: Ride, right: Ride) => new Date(left.departureAt).getTime() - new Date(right.departureAt).getTime()
      ));
      setForm({ pickup: '', destination: '', vehicleType: 'Car', departureAt: '', availableSeats: '3', fare: '', description: '' });
      toast.success('Ride posted');
    } catch (requestError) {
      toast.error((requestError as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to post ride');
    } finally {
      setSaving(false);
    }
  };

  const requestRide = async (ride: Ride) => {
    if (ride.isSample) {
      toast('Sample rides are for display only. Requests are sent to real community drivers.');
      return;
    }
    setRequestingRideId(ride._id);
    try {
      await ridesApi.request(ride._id);
      setRequestedRideIds((current) => [...current, ride._id]);
      toast.success('Request sent to the driver for confirmation.');
    } catch (requestError) {
      toast.error((requestError as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to request this ride');
    } finally {
      setRequestingRideId('');
    }
  };

  const viewDetails = async (ride: Ride) => {
    setSelectedRide(ride);
    setRideRequests([]);
    if (!ride.isSample && ride.driverId === user?._id) {
      setRequestsLoading(true);
      try {
        const response = await ridesApi.requestsForRide(ride._id);
        setRideRequests(response.data.requests);
      } catch {
        toast.error('Ride requests could not be loaded.');
      } finally {
        setRequestsLoading(false);
      }
    }
  };

  const minDeparture = getLocalDateTimeValue(new Date());

  return (
    <div className="mx-auto w-full max-w-140 px-3 py-3 sm:px-0">
      <PageHeading title="Ride Services" description="Share your route or find a seat with a local driver." />

      <form onSubmit={submitRide} className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{getInitials(user?.fullName || 'You')}</div>
          <div><h2 className="text-sm font-bold text-slate-950">Post a Ride</h2><p className="text-xs text-slate-500">Share your trip with the TaskAnt community.</p></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <RideField label="Pickup location" required><input required maxLength={120} value={form.pickup} onChange={(event) => setForm({ ...form, pickup: event.target.value })} placeholder="e.g. Banani, Dhaka" className={rideInputClass} /></RideField>
          <RideField label="Destination" required><input required maxLength={120} value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} placeholder="e.g. Dhanmondi 27" className={rideInputClass} /></RideField>
          <RideField label="Vehicle type" required><select required value={form.vehicleType} onChange={(event) => setForm({ ...form, vehicleType: event.target.value })} className={rideInputClass}><option value="Car">Car</option><option value="Bike">Bike</option></select></RideField>
          <RideField label="Departure date & time" required><input required type="datetime-local" min={minDeparture} value={form.departureAt} onChange={(event) => setForm({ ...form, departureAt: event.target.value })} className={rideInputClass} /></RideField>
          <RideField label="Available seats" required><input required type="number" min="1" max="8" value={form.availableSeats} onChange={(event) => setForm({ ...form, availableSeats: event.target.value })} className={rideInputClass} /></RideField>
          <RideField label="Expected fare (BDT)" required><input required type="number" min="1" max="100000" value={form.fare} onChange={(event) => setForm({ ...form, fare: event.target.value })} placeholder="e.g. 350" className={rideInputClass} /></RideField>
        </div>
        <label className="mt-2 block text-xs font-semibold text-slate-600">Description <span className="font-normal text-slate-400">(optional)</span>
          <textarea maxLength={500} rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add any useful trip details..." className={`${rideInputClass} mt-1 resize-y`} />
        </label>
        <div className="mt-2 flex justify-end border-t border-slate-100 pt-2">
          <Button type="submit" size="sm" loading={saving}>Post Ride</Button>
        </div>
      </form>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-extrabold text-slate-950">Available rides</h2>
        <span className="text-xs text-slate-500">{rides.length} {rides.length === 1 ? 'ride' : 'rides'}</span>
      </div>
      {loading ? <LoadingSpinner className="min-h-32" /> : error ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-800">Could not load rides</p>
          <p className="mt-1 text-xs text-slate-500">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => void load()}>Try again</Button>
        </div>
      ) : rides.length ? (
        <div className="space-y-3">{rides.map((ride) => (
          <RideCard key={ride._id} ride={ride} requested={requestedRideIds.includes(ride._id)}
            requesting={requestingRideId === ride._id} ownRide={ride.driverId === user?._id}
            onDetails={() => void viewDetails(ride)} onRequest={() => void requestRide(ride)} />
        ))}</div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-7 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-800">No community rides yet</p>
          <p className="mt-1 text-xs text-slate-500">Post a ride above and it will appear here.</p>
        </div>
      )}

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-bold text-slate-700">Sample routes</h2>
        <div className="space-y-3">{sampleRides.map((ride) => (
          <RideCard key={ride._id} ride={ride} requested={false} requesting={false} ownRide={false}
            onDetails={() => void viewDetails(ride)} onRequest={() => void requestRide(ride)} />
        ))}</div>
      </section>

      {selectedRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedRide(null);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="ride-details-title" className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <header className="flex items-start justify-between border-b border-slate-100 p-4">
              <div><p className="text-xs font-semibold text-orange-600">{selectedRide.vehicleType} ride{selectedRide.isSample ? ' · Sample' : ''}</p>
                <h2 id="ride-details-title" className="mt-1 text-lg font-extrabold text-slate-950">{selectedRide.pickup} <span className="text-slate-400">→</span> {selectedRide.destination}</h2></div>
              <button type="button" onClick={() => setSelectedRide(null)} aria-label="Close ride details" className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100">×</button>
            </header>
            <div className="space-y-3 p-4 text-sm text-slate-600">
              <p><strong className="text-slate-900">Departure:</strong> {formatDateTime(selectedRide.departureAt)}</p>
              <p><strong className="text-slate-900">Seats available:</strong> {selectedRide.availableSeats}</p>
              <p><strong className="text-slate-900">Expected fare:</strong> {formatCurrency(selectedRide.fare)} per seat</p>
              {selectedRide.description && <p className="whitespace-pre-wrap">{selectedRide.description}</p>}
              <p><strong className="text-slate-900">Driver:</strong> {selectedRide.driver?.fullName || 'TaskAnt member'}</p>
              {!selectedRide.isSample && selectedRide.driverId === user?._id && (
                <div className="border-t border-slate-100 pt-3">
                  <h3 className="font-bold text-slate-900">Ride requests</h3>
                  {requestsLoading ? <p className="mt-2 text-xs text-slate-500">Loading requests…</p> : rideRequests.length ? (
                    <ul className="mt-2 space-y-2">{rideRequests.map((request) => <li key={request._id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                      <span className="font-bold text-slate-800">{request.passenger?.fullName || 'TaskAnt member'}</span>
                      <span className="ml-2 text-slate-500">Pending confirmation · {formatDateTime(request.createdAt)}</span>
                    </li>)}</ul>
                  ) : <p className="mt-2 text-xs text-slate-500">No ride requests yet.</p>}
                </div>
              )}
              {selectedRide.isSample && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">This example is separate from community ride posts and cannot receive a request.</p>}
            </div>
            <footer className="flex justify-end border-t border-slate-100 p-3">
              <Button size="sm" variant="outline" onClick={() => setSelectedRide(null)}>Close</Button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

const rideInputClass = 'h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100';

function RideField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-slate-600">{label}{required && <span className="text-orange-600"> *</span>}<span className="mt-1 block">{children}</span></label>;
}

function RideCard({
  ride, requested, requesting, ownRide, onDetails, onRequest,
}: {
  ride: Ride;
  requested: boolean;
  requesting: boolean;
  ownRide: boolean;
  onDetails: () => void;
  onRequest: () => void;
}) {
  const VehicleIcon = ride.vehicleType === 'Car' ? CarFront : Bike;
  const driverName = ride.driver?.fullName || 'TaskAnt member';
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 px-4 pt-3.5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${ride.isSample ? 'bg-slate-500' : 'bg-slate-900'}`}>{getInitials(driverName)}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-950">{driverName}</p>
          <p className="truncate text-xs text-slate-500">{ride.isSample ? 'Sample route' : `Posted ${timeAgo(ride.createdAt)}`}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-600"><VehicleIcon className="h-5 w-5" /></div>
      </header>
      <div className="px-4 pb-3 pt-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-bold leading-5 text-slate-950">{ride.pickup} <span className="text-slate-400">→</span> {ride.destination}</h3>
          <strong className="shrink-0 text-sm font-extrabold text-orange-600">{formatCurrency(ride.fare)}</strong>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-orange-500" />{formatDateTime(ride.departureAt)}</span>
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-slate-400" />{ride.availableSeats} {ride.availableSeats === 1 ? 'seat' : 'seats'}</span>
          <span className="flex items-center gap-1.5"><VehicleIcon className="h-3.5 w-3.5 text-slate-400" />{ride.vehicleType}</span>
        </div>
      </div>
      <div className="mx-4 flex items-center justify-end gap-1 border-t border-slate-100 py-2">
        <button type="button" onClick={onDetails} className="rounded-md px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">View Details</button>
        <Button type="button" size="sm" loading={requesting} disabled={ownRide || requested} onClick={onRequest}>
          {ownRide ? 'Your ride' : requested ? 'Request sent' : 'Request Ride'}
        </Button>
      </div>
    </article>
  );
}

function getLocalDateTimeValue(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function createSampleRides(): Ride[] {
  const now = new Date();
  const departure = (days: number, hour: number, minute: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  };
  const sampleDriver = (name: string, id: string) => ({
    _id: id,
    fullName: name,
    location: 'Dhaka',
    role: 'user' as const,
    verificationStatus: 'Verified' as const,
    rating: 4.8,
    reviewCount: 12,
    completedTasks: 8,
    postedTasks: 5,
    createdAt: now.toISOString(),
  });
  return [
    { _id: 'sample-ride-banani-dhanmondi', pickup: 'Banani, Dhaka', destination: 'Dhanmondi 27, Dhaka', vehicleType: 'Car', departureAt: departure(1, 8, 15), availableSeats: 2, fare: 250, description: 'Heading toward Dhanmondi via Karwan Bazar.', status: 'Open', driverId: 'sample-driver-1', driver: sampleDriver('Nusrat Jahan', 'sample-driver-1'), createdAt: now.toISOString(), updatedAt: now.toISOString(), isSample: true },
    { _id: 'sample-ride-mirpur-farmgate', pickup: 'Mirpur 10, Dhaka', destination: 'Farmgate, Dhaka', vehicleType: 'Bike', departureAt: departure(1, 9, 0), availableSeats: 1, fare: 120, description: 'Morning commute; one passenger seat available.', status: 'Open', driverId: 'sample-driver-2', driver: sampleDriver('Mehedi Hasan', 'sample-driver-2'), createdAt: now.toISOString(), updatedAt: now.toISOString(), isSample: true },
    { _id: 'sample-ride-uttara-airport', pickup: 'Uttara Sector 7, Dhaka', destination: 'Hazrat Shahjalal International Airport', vehicleType: 'Car', departureAt: departure(2, 6, 30), availableSeats: 3, fare: 300, description: 'Early airport drop. Room for luggage.', status: 'Open', driverId: 'sample-driver-3', driver: sampleDriver('Farhana Akter', 'sample-driver-3'), createdAt: now.toISOString(), updatedAt: now.toISOString(), isSample: true },
    { _id: 'sample-ride-gulshan-motijheel', pickup: 'Gulshan 2, Dhaka', destination: 'Motijheel, Dhaka', vehicleType: 'Bike', departureAt: departure(2, 17, 45), availableSeats: 1, fare: 180, description: 'Evening ride through the city centre.', status: 'Open', driverId: 'sample-driver-4', driver: sampleDriver('Tanvir Ahmed', 'sample-driver-4'), createdAt: now.toISOString(), updatedAt: now.toISOString(), isSample: true },
  ];
}

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-3 py-5">
      <PageHeading title="Privacy" description="How TaskAnt handles account and service information." />
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <ShieldCheck className="h-8 w-8 text-orange-500" />
        <div className="mt-5 space-y-5 text-sm leading-7 text-slate-600">
          <section><h2 className="font-bold text-slate-950">Account information</h2><p>TaskAnt uses your profile details to operate tasks, bids, messages, notifications, and payments.</p></section>
          <section><h2 className="font-bold text-slate-950">Service integrations</h2><p>Ride posts and ride requests are stored separately from tasks. Sample routes on Ride Services are display-only and cannot accept requests.</p></section>
          <section><h2 className="font-bold text-slate-950">Account controls</h2><p>You can update profile information from My Profile and manage alert preferences from Settings.</p></section>
        </div>
      </div>
    </div>
  );
}
