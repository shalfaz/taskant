'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,  CalendarDays, CheckCircle2, Clock3, DollarSign,
  CarFront, MapPin, MessageSquare, PackageSearch, Send, ShieldCheck, Star, Users, WalletCards,
} from 'lucide-react';
import {
  bidsApi, dashboardApi, messagesApi, notificationsApi, paymentsApi, reviewsApi, tasksApi,
  usersApi,
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/Card';
import TaskCard from '../components/TaskCard';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import { formatCurrency, formatDate, timeAgo } from '../utils/format';
import { TASK_CATEGORIES, type Bid, type Message, type Task } from '../types';

function PageHeading({ title, description }: { title: string; description?: string }) {
  return <div className="mb-5"><h1 className="text-2xl font-extrabold text-slate-950">{title}</h1>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>;
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-3 font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{detail}</p></div>;
}

export default function MarketplaceRoutePage() {
  const pathname = usePathname();
  const { user, updateUser } = useAuth();
  const route = pathname.replace(/\/+$/, '');

  if (route === '/tasks' || route === '/marketplace') return <TasksPage />;
  if (route === '/post-task') return <PostTaskPage />;
  if (route === '/my-tasks') return <MyTasksPage />;
  if (route === '/my-tasks/posted' || route === '/my-tasks/accepted') return <MyTasksPage />;
  if (route === '/categories') return <CategoriesPage />;
  if (route === '/saved') return <SavedTasksPage />;
  if (route === '/messages') return <MessagesPage />;
  if (/^\/chat\/[^/]+$/.test(route)) return <MessagesPage taskId={route.split('/').pop()} />;
  if (route === '/notifications') return <NotificationsPage />;
  if (route === '/payments') return <PaymentsPage />;
  if (route === '/reviews') return <ReviewsPage />;
  if (route === '/profile') return <ProfilePage user={user} updateUser={updateUser} />;
  if (route === '/settings') return <SettingsPage />;
  if (route === '/help') return <HelpPage />;
  if (route === '/privacy') return <PrivacyPage />;
  if (route === '/store') return <StorePage />;
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
  const [form, setForm] = useState({ title: '', description: '', category: TASK_CATEGORIES[0], location: '', deadline: '', budget: '', additionalInstructions: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await tasksApi.create({ ...form, budget: Number(form.budget), deadline: new Date(form.deadline).toISOString() });
      toast.success('Task posted');
      router.push('/my-tasks/posted');
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to post task');
    } finally { setSaving(false); }
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
        <Button type="submit" loading={saving} className="w-full"><Send className="h-4 w-4" /> Publish task</Button>
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
  const previewTasks = process.env.NODE_ENV === 'development' ? [
    { _id: 'preview-my-home-cleaning', title: 'Deep clean a two-bedroom apartment', description: 'Kitchen, bathroom, balcony, and living room need a complete clean before Friday evening.', category: 'Cleaning', location: 'Uttara, Dhaka', deadline: '2026-11-06T18:00:00.000Z', budget: 1800, status: 'Bidding', posterId: user?._id || 'preview-me', poster: user, bidCount: 4, createdAt: '2026-11-03T08:00:00.000Z', updatedAt: '2026-11-03T08:00:00.000Z' },
    { _id: 'preview-my-phone-sale', title: 'Help photograph items for an online listing', description: 'Three household items need clear photos and short descriptions for a second-hand marketplace.', category: 'Photography & Media', location: 'Mirpur 10, Dhaka', deadline: '2026-11-09T14:00:00.000Z', budget: 700, status: 'Open', posterId: user?._id || 'preview-me', poster: user, bidCount: 2, createdAt: '2026-11-02T10:00:00.000Z', updatedAt: '2026-11-02T10:00:00.000Z' },
    { _id: 'preview-my-event-decor', title: 'Arrange birthday decorations in Gulshan', description: 'Set up balloons, a backdrop, and a small gift table for a family birthday celebration.', category: 'Event Help', location: 'Gulshan 1, Dhaka', deadline: '2026-11-08T16:00:00.000Z', budget: 1500, status: 'Assigned', posterId: user?._id || 'preview-me', poster: user, bidCount: 3, createdAt: '2026-11-02T08:00:00.000Z', updatedAt: '2026-11-02T08:00:00.000Z' },
    { _id: 'preview-my-cables', title: 'Organize office cables and workstation setup', description: 'Label cables and arrange four desks neatly before the new office team arrives Monday morning.', category: 'Office Work', location: 'Mohakhali, Dhaka', deadline: '2026-11-10T11:00:00.000Z', budget: 950, status: 'Open', posterId: user?._id || 'preview-me', poster: user, bidCount: 1, createdAt: '2026-11-01T09:00:00.000Z', updatedAt: '2026-11-01T09:00:00.000Z' },
  ] as Task[] : [];
  const acceptedPreviewTasks = process.env.NODE_ENV === 'development' ? [
    { _id: 'preview-accepted-delivery', title: 'Deliver documents from Motijheel to Banani', description: 'Collect the signed office documents and deliver them to the client office before lunch.', category: 'Document Delivery', location: 'Motijheel to Banani, Dhaka', deadline: '2026-11-05T13:00:00.000Z', budget: 450, status: 'In Progress', posterId: 'preview-poster-1', bidCount: 3, workerId: user?._id, createdAt: '2026-11-03T07:00:00.000Z', updatedAt: '2026-11-03T09:00:00.000Z' },
    { _id: 'preview-accepted-grocery', title: 'Weekly grocery pickup in Uttara', description: 'Purchase the listed groceries and deliver them to a nearby apartment this afternoon.', category: 'Shopping & Errands', location: 'Uttara, Dhaka', deadline: '2026-11-06T17:00:00.000Z', budget: 600, status: 'Assigned', posterId: 'preview-poster-2', bidCount: 2, workerId: user?._id, createdAt: '2026-11-02T12:00:00.000Z', updatedAt: '2026-11-02T15:00:00.000Z' },
    { _id: 'preview-accepted-furniture', title: 'Assemble a small study desk', description: 'Assemble a flat-pack study desk and place it beside the bedroom window.', category: 'Home Repair', location: 'Savar, Dhaka', deadline: '2026-11-09T15:00:00.000Z', budget: 850, status: 'Assigned', posterId: 'preview-poster-3', bidCount: 4, workerId: user?._id, createdAt: '2026-11-01T10:00:00.000Z', updatedAt: '2026-11-01T14:00:00.000Z' },
  ] as Task[] : [];

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
        <div className="p-5"><h2 className="font-bold text-slate-900">Task details</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{task.description}</p>{task.additionalInstructions && <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><strong className="text-slate-900">Additional instructions:</strong> {task.additionalInstructions}</p>}</div>
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

function MessagesPage({ taskId }: { taskId?: string }) {
  const { token, user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Array<{ taskId: string; taskTitle: string; otherUser: { fullName: string } | null; unread: number }>>([]);
  const [selected, setSelected] = useState(taskId || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async (id: string) => {
    const res = await messagesApi.getByTask(id);
    setMessages(res.data.messages);
  }, []);
  useEffect(() => {
    messagesApi.getConversations().then((res) => {
      setConversations(res.data.conversations);
      if (!selected && res.data.conversations[0]) setSelected(res.data.conversations[0].taskId);
    }).finally(() => setLoading(false));
  }, [selected]);
  useEffect(() => { if (selected) void loadMessages(selected); }, [loadMessages, selected]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    try {
      await messagesApi.send({ taskId: selected, content: text.trim() });
      setText('');
      await loadMessages(selected);
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to send message');
    }
  };

  return <div className="mx-auto max-w-5xl px-3 py-5"><PageHeading title="Messages" description={token ? 'Messages for assigned tasks.' : ''} /><div className="grid min-h-130 overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-[280px_1fr]">{loading ? <LoadingSpinner /> : <><div className="border-b border-slate-200 md:border-b-0 md:border-r">{conversations.length ? conversations.map((conversation) => <button key={conversation.taskId} onClick={() => { setSelected(conversation.taskId); router.push(`/chat/${conversation.taskId}`); }} className={`w-full border-b border-slate-100 p-4 text-left ${selected === conversation.taskId ? 'bg-orange-50' : 'hover:bg-slate-50'}`}><p className="truncate text-sm font-bold text-slate-900">{conversation.otherUser?.fullName || 'Task participant'}</p><p className="truncate text-xs text-slate-500">{conversation.taskTitle}</p></button>) : <p className="p-5 text-sm text-slate-500">Assigned tasks will create conversations.</p>}</div><div className="flex min-h-105 flex-col">{selected ? <><div className="flex-1 space-y-3 overflow-y-auto p-4">{messages.map((message) =>   <div key={message._id} className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${message.senderId === user?._id ? 'ml-auto bg-orange-600 text-white' : 'bg-slate-100 text-slate-700'}`}><p>{message.content}</p><span className={`mt-1 block text-[10px] ${message.senderId === user?._id ? 'text-orange-100' : 'text-slate-400'}`}>{timeAgo(message.createdAt)}</span></div>)}</div><form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-3"><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." className="h-10 flex-1 rounded-full bg-slate-100 px-4 text-sm outline-none focus:ring-2 focus:ring-orange-200" /><button className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white"><Send className="h-4 w-4" /></button></form></> : <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Select a conversation.</div>}</div></>}</div></div>;
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
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await usersApi.updateProfile(form);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to update profile');
    } finally { setSaving(false); }
  };
  return <div className="mx-auto max-w-2xl px-3 py-5"><PageHeading title="Profile" description="Your public TaskAnt identity." /><form onSubmit={save} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-4 border-b border-slate-100 pb-5"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-xl font-extrabold text-white">{user?.fullName.charAt(0)}</div><div><p className="font-extrabold text-slate-950">{user?.fullName}</p><p className="text-sm text-slate-500">{user?.location}</p><p className="mt-1 text-xs font-bold text-orange-600">{user?.rating.toFixed(1)} rating · {user?.completedTasks || 0} completed tasks</p></div></div><Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /><div className="grid gap-4 sm:grid-cols-2"><Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div><Textarea label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /><Button loading={saving} type="submit">Save profile</Button></form></div>;
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
  const rides = [
    { type: 'Car', route: 'Banani to Dhanmondi 27', time: 'Today, 5:30 PM', price: '৳350', requester: 'Nusrat Jahan' },
    { type: 'Bike', route: 'Mirpur 10 to Farmgate', time: 'Today, 6:15 PM', price: '৳120', requester: 'Mehedi Hasan' },
    { type: 'Bike', route: 'Uttara to Shahjalal Airport', time: 'Tomorrow, 8:00 AM', price: '৳280', requester: 'Farhana Akter' },
  ];
  return (
    <div className="mx-auto max-w-5xl px-3 py-5">
      <PageHeading title="Ride Services" description="Plan bike and car travel across TaskAnt." />
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" className="rounded-xl border border-orange-300 bg-orange-50 p-4 text-left">
            <CarFront className="h-7 w-7 text-orange-600" /><strong className="mt-3 block text-slate-950">Car</strong><span className="text-sm text-slate-500">Comfortable trips</span>
          </button>
          <button type="button" className="rounded-xl border border-slate-200 p-4 text-left hover:border-orange-300">
            <Clock3 className="h-7 w-7 text-slate-700" /><strong className="mt-3 block text-slate-950">Bike</strong><span className="text-sm text-slate-500">Quick local rides</span>
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 px-4 py-3"><span className="text-xs font-bold text-slate-400">PICKUP</span><p className="mt-1 text-sm font-semibold text-slate-800">Choose pickup location</p></div>
          <div className="rounded-xl border border-slate-200 px-4 py-3"><span className="text-xs font-bold text-slate-400">DESTINATION</span><p className="mt-1 text-sm font-semibold text-slate-800">Choose destination</p></div>
        </div>
      </div>
      {process.env.NODE_ENV === 'development' && <section className="mt-4 space-y-3">{rides.map((ride) => <article key={`${ride.type}-${ride.route}`} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50">{ride.type === 'Car' ? <CarFront className="h-5 w-5 text-orange-600" /> : <Clock3 className="h-5 w-5 text-orange-600" />}</div><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{ride.route}</p><p className="mt-1 text-xs text-slate-500">{ride.type} · {ride.requester} · {ride.time}</p></div><strong className="text-sm text-orange-600">{ride.price}</strong></article>)}</section>}
    </div>
  );
}

function StorePage() {
  const listings = [
    { title: 'English Grammar Practice Book', detail: 'Like new, edition 2024', location: 'Dhanmondi, Dhaka', price: '৳450', seller: 'Nusrat Jahan' },
    { title: 'Wireless Bluetooth Headphones', detail: 'Good battery and sound quality', location: 'Mirpur, Dhaka', price: '৳1,200', seller: 'Mehedi Hasan' },
    { title: 'Adjustable Desk Lamp', detail: 'Warm light, USB powered', location: 'Pabna Sadar, Pabna', price: '৳650', seller: 'Farhana Akter' },
  ];
  return (
    <div className="mx-auto max-w-5xl px-3 py-5">
      <PageHeading title="Online Store" description="Buy and sell items through TaskAnt." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {process.env.NODE_ENV === 'development' && listings.map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-32 items-center justify-center rounded-xl bg-slate-100"><PackageSearch className="h-10 w-10 text-slate-400" /></div>
            <h2 className="mt-4 font-bold text-slate-950">{item.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
            <p className="mt-2 text-xs text-slate-500">{item.location}</p>
            <p className="mt-1 text-xs font-semibold text-slate-600">Seller: {item.seller}</p>
            <p className="mt-3 font-extrabold text-orange-600">{item.price}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-3 py-5">
      <PageHeading title="Privacy" description="How TaskAnt handles account and service information." />
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <ShieldCheck className="h-8 w-8 text-orange-500" />
        <div className="mt-5 space-y-5 text-sm leading-7 text-slate-600">
          <section><h2 className="font-bold text-slate-950">Account information</h2><p>TaskAnt uses your profile details to operate tasks, bids, messages, notifications, and payments.</p></section>
          <section><h2 className="font-bold text-slate-950">Service integrations</h2><p>Ride and store integrations will request separate permissions when their providers are connected. They do not publish fake activity or data.</p></section>
          <section><h2 className="font-bold text-slate-950">Account controls</h2><p>You can update profile information from My Profile and manage alert preferences from Settings.</p></section>
        </div>
      </div>
    </div>
  );
}
