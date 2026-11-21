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
import SupportChatWidget from '../components/SupportChatWidget';
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
  const [supportOpen, setSupportOpen] = useState(false);
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
    <nav className="space-y-0">
      {links.map((link) => {
        const Icon = link.icon;
        const active =
          pathname === link.to ||
          (link.to === '/my-tasks' && pathname.startsWith('/my-tasks')) ||
          (link.to === '/dashboard' && pathname === '/dashboard');
        if (link.to === '/help') {
          return (
            <button
              key={link.to}
              type="button"
              onClick={() => { setSidebarOpen(false); setSupportOpen(true); }}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-left text-[13.5px] leading-4 transition-colors ${supportOpen ? 'bg-orange-50/80 font-semibold text-orange-600' : 'font-medium text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'}`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${supportOpen ? 'text-orange-600' : 'text-slate-500'}`} />
              <span className="truncate">{link.label}</span>
            </button>
          );
        }
        return (
          <Link key={link.to} href={link.to} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-[13.5px] leading-4 transition-colors ${active ? 'bg-orange-50/80 font-semibold text-orange-600' : 'font-medium text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'}`}>
            <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-orange-600' : 'text-slate-500'}`} />
            <span className="truncate">{link.label}</span>
            {link.to === '/messages' && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-orange-500" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F0F2F5]">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`taskant-sidebar fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col justify-between overflow-y-auto bg-white pb-10 shadow-2xl transition-transform lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4"><Link href="/dashboard"><Logo size="sm" /></Link><button className="p-2" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button></div>
          <div className="p-3">{renderSidebarLinks()}</div>
        </div>
        {!isAdmin && (
          <div className="mx-3 mt-2 border-t border-slate-200/80 pt-2">
            <button onClick={() => { setSidebarOpen(false); void handleLogout(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600">
              <LogOut className="h-5 w-5 shrink-0" /> Log out
            </button>
          </div>
        )}
      </aside>

      <header className="sticky top-0 z-30 flex h-16 flex-nowrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-3 shadow-xs lg:px-4">
        <div className="flex shrink-0 items-center gap-2 lg:w-[240px]">
          <button className="shrink-0 p-2 lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></button>
          <Link href="/dashboard" className="hidden shrink-0 sm:block"><Logo size="sm" /></Link>
        </div>
        {!isAdmin && (
          <nav className="hidden h-full min-w-0 flex-1 max-w-[600px] items-stretch justify-center sm:flex">
            {[
              { href: '/dashboard', icon: BriefcaseBusiness, label: 'Task Worker' },
              { href: '/my-tasks', icon: LayoutDashboard, label: 'My Tasks' },
              { href: '/rides', icon: CarFront, label: 'Ride Services' },
              { href: '/store', icon: Store, label: 'Online Store' },
              { href: '/categories', icon: Grid2X2, label: 'Categories' },
            ].map((item) => (
              <Link key={item.href} href={item.href} title={item.label} className={`relative flex flex-1 items-center justify-center border-b-[3px] px-1.5 sm:px-3 ${pathname === item.href || (item.href === '/my-tasks' && pathname.startsWith('/my-tasks')) ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                <item.icon className="h-5 w-5 shrink-0" />
              </Link>
            ))}
          </nav>
        )}
        {!isAdmin && (
          <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-1.5 lg:w-[240px]">
            <Link href="/tasks" title="Search" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 sm:h-10 sm:w-10"><Search className="h-4 w-4 sm:h-5 sm:w-5" /></Link>
            <Link href="/messages" title="Messages" className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${pathname === '/messages' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" /></Link>
            <Link href="/notifications" title="Notifications" className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${pathname === '/notifications' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />{unread > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{unread}</span>}
            </Link>
            <Link href="/profile" title="Profile" className="ml-0.5 flex shrink-0 items-center gap-1 rounded-full border border-slate-200 p-1 pl-1.5 sm:ml-1 sm:p-1.5 sm:pl-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{user?.fullName.charAt(0)}</span>
              <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
            </Link>
          </div>
        )}
      </header>

      <div className="flex w-full">
        <aside className="taskant-sidebar sticky top-16 hidden h-[calc(100dvh-64px)] w-[240px] shrink-0 flex-col justify-between overflow-y-auto bg-[#F0F2F5] px-2.5 pt-2 pb-4 lg:flex">
          <div>
            <div className="mb-1.5 flex items-center gap-2.5 border-b border-slate-200/70 px-2 pb-1.5 pt-0.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {user?.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-bold leading-tight text-slate-900">{user?.fullName}</p>
                <p className="truncate text-[11px] leading-tight text-slate-500">{user?.location}</p>
              </div>
            </div>
            {renderSidebarLinks()}
          </div>
          <div className="mt-1.5 shrink-0 border-t border-slate-200/80 pt-1.5">
            <button onClick={() => void handleLogout()} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-[13.5px] leading-4 font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600">
              <LogOut className="h-4 w-4 shrink-0" /> Log out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden px-2 lg:pr-[240px]">
          {pathname !== '/dashboard' ? (
            <div className="mx-auto w-full max-w-[600px]">{children}</div>
          ) : children}
        </main>
      </div>
      <SupportChatWidget open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  );
}
