'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  Bell, Bookmark, BriefcaseBusiness, CarFront, CheckSquare, ChevronDown, CircleHelp, CreditCard,
  Grid2X2, LayoutDashboard, ListTodo, LogOut, Menu, MessageSquare, Search, Settings,
  Shield, Store, User, X,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { notificationsApi } from '../services/api';

const userLinks = [
  { to: '/profile', icon: User, label: 'My Profile' },
  { to: '/dashboard', icon: BriefcaseBusiness, label: 'Task Worker' },
  { to: '/my-tasks', icon: LayoutDashboard, label: 'My Tasks' },
  { to: '/my-tasks/accepted', icon: CheckSquare, label: 'Accepted Tasks' },
  { to: '/rides', icon: CarFront, label: 'Ride Services' },
  { to: '/store', icon: Store, label: 'Online Store' },
  { to: '/categories', icon: Grid2X2, label: 'Categories' },
  { to: '/saved', icon: Bookmark, label: 'Saved Tasks' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/help', icon: CircleHelp, label: 'Support' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/privacy', icon: Shield, label: 'Privacy' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard' },
  { to: '/admin/users', icon: User, label: 'Manage Users' },
  { to: '/admin/tasks', icon: ListTodo, label: 'Manage Tasks' },
  { to: '/admin/verifications', icon: Shield, label: 'Verifications' },
  { to: '/admin/reports', icon: Shield, label: 'Reports' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const links = isAdmin ? adminLinks : userLinks;

  const handleLogout = async () => {
    const serverRevoked = await logout();
    router.push('/login');
    if (!serverRevoked) toast.error('Signed out locally, but server-side revocation could not be confirmed.');
  };

  useEffect(() => {
    if (user && !isAdmin) {
      notificationsApi.list().then((res) => setUnread(res.data.unreadCount)).catch((error: unknown) => {
        const isApiError = axios.isAxiosError<{ message?: string }>(error);
        console.error('Unable to load notifications', {
          status: isApiError ? error.response?.status : undefined,
          code: isApiError ? error.code : undefined,
          message: error instanceof Error ? error.message : 'Unknown error',
          serverMessage: isApiError ? error.response?.data?.message : undefined,
          requestId: isApiError ? error.response?.headers?.['x-request-id'] : undefined,
        });
      });
    }
  }, [user, isAdmin, pathname]);

  const renderSidebarLinks = () => (
    <nav className="space-y-1">
      {links.map((link) => {
        const Icon = link.icon;
        const active =
          pathname === link.to ||
          (link.to === '/my-tasks' && pathname.startsWith('/my-tasks')) ||
          (link.to === '/dashboard' && pathname === '/dashboard');
        return (
          <Link key={link.to} href={link.to} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm font-semibold transition-colors ${active ? 'text-orange-700' : 'text-slate-600 hover:text-slate-900'}`}>
            <Icon className={`h-5 w-5 ${active ? 'text-orange-600' : 'text-slate-500'}`} />
            {link.label}
            {link.to === '/messages' && <span className="ml-auto h-2 w-2 rounded-full bg-orange-500" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f2f4f7]">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className="taskant-sidebar fixed left-0 top-14 z-40 hidden h-[calc(100vh-56px)] w-[220px] overflow-y-auto bg-[#f2f4f7] px-2 py-3 lg:block">
        <div className="mb-2 flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
            {user?.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{user?.fullName}</p>
            <p className="truncate text-xs text-slate-500">{user?.location}</p>
          </div>
        </div>
        {renderSidebarLinks()}
        <button onClick={() => void handleLogout()} className="mt-2 flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-semibold text-slate-600 hover:text-red-600">
          <LogOut className="h-5 w-5" /> Log out
        </button>
      </aside>

      <aside className={`taskant-sidebar fixed inset-y-0 left-0 z-50 w-[280px] overflow-y-auto bg-white shadow-2xl transition-transform lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-17 items-center justify-between border-b px-4"><Link href="/dashboard"><Logo size="sm" /></Link><button className="p-2" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button></div>
        <div className="overflow-y-auto p-3">{renderSidebarLinks()}</div>
        {!isAdmin && (
          <button onClick={() => { setSidebarOpen(false); void handleLogout(); }} className="mx-3 mt-2 flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-semibold text-red-600">
            <LogOut className="h-5 w-5" /> Log out
          </button>
        )}
      </aside>

      <header className="sticky top-0 z-30 grid h-14 grid-cols-[220px_1fr_220px] items-center border-b border-slate-200 bg-white px-2 shadow-[0_1px_2px_rgba(15,23,42,.06)] max-md:grid-cols-[auto_1fr_auto]">
        <button className="mr-1 p-2 lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></button>
        <Link href="/dashboard" className="hidden sm:block"><Logo size="sm" /></Link>
        {!isAdmin && (
          <nav className="hidden h-full w-full max-w-[620px] grid-cols-5 justify-self-center items-stretch md:grid">
            {[
              { href: '/dashboard', icon: BriefcaseBusiness, label: 'Task Worker' },
              { href: '/my-tasks', icon: LayoutDashboard, label: 'My Tasks' },
              { href: '/rides', icon: CarFront, label: 'Ride Services' },
              { href: '/store', icon: Store, label: 'Online Store' },
              { href: '/categories', icon: Grid2X2, label: 'Categories' },
            ].map((item) => (
              <Link key={item.href} href={item.href} title={item.label} className={`relative flex items-center justify-center border-b-[3px] px-3 ${pathname === item.href || (item.href === '/my-tasks' && pathname.startsWith('/my-tasks')) ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                <item.icon className="h-5 w-5" />
              </Link>
            ))}
          </nav>
        )}
        {!isAdmin && (
          <div className="flex items-center justify-end gap-1">
            <Link href="/tasks" title="Search" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"><Search className="h-5 w-5" /></Link>
            <Link href="/messages" title="Messages" className={`relative flex h-10 w-10 items-center justify-center rounded-full ${pathname === '/messages' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><MessageSquare className="h-5 w-5" /></Link>
            <Link href="/notifications" title="Notifications" className={`relative flex h-10 w-10 items-center justify-center rounded-full ${pathname === '/notifications' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <Bell className="h-5 w-5" />{unread > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{unread}</span>}
            </Link>
            <Link href="/profile" title="Profile" className="ml-1 flex items-center gap-1 rounded-full border border-slate-200 p-1.5 pl-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{user?.fullName.charAt(0)}</span>
              <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
            </Link>
          </div>
        )}
      </header>

      <main>
        {pathname !== '/dashboard' ? (
          <div className="mx-auto w-full max-w-[560px]">{children}</div>
        ) : children}
      </main>
    </div>
  );
}
