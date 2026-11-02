'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  Bell, Bookmark, CarFront, CheckSquare, ChevronDown, CircleHelp, CreditCard,
  Grid2X2, Home, LayoutDashboard, ListTodo, LogOut, Menu, MessageSquare,
  Search, Settings, Shield, Star, Store, User, X,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { notificationsApi } from '../services/api';

const userLinks = [
  { to: '/profile', icon: User, label: 'My Profile' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'My Tasks' },
  { to: '/my-tasks/posted', icon: ListTodo, label: 'Posted Tasks' },
  { to: '/my-tasks/accepted', icon: CheckSquare, label: 'Accepted Tasks' },
  { to: '/tasks', icon: Search, label: 'Browse Tasks' },
  { to: '/categories', icon: Grid2X2, label: 'Categories' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/saved', icon: Bookmark, label: 'Saved Tasks' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/reviews', icon: Star, label: 'Reviews' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/help', icon: CircleHelp, label: 'Help' },
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
  const [search, setSearch] = useState('');
  const links = isAdmin ? adminLinks : userLinks;

  const handleLogout = async () => {
    const serverRevoked = await logout();
    router.push('/login');
    if (!serverRevoked) toast.error('Signed out locally, but server-side revocation could not be confirmed.');
  };

  useEffect(() => {
    if (user && !isAdmin) {
      notificationsApi.list().then((res) => setUnread(res.data.unreadCount)).catch((error: unknown) => {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        console.error('Unable to load notifications', { status });
      });
    }
  }, [user, isAdmin, pathname]);

  const renderSidebarLinks = () => (
    <nav className="space-y-1">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.to;
        return (
          <Link key={link.to} href={link.to} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
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

      <aside className="fixed left-0 top-17 z-40 hidden h-[calc(100vh-68px)] w-65 overflow-y-auto border-r border-slate-200 bg-white px-3 py-4 lg:block">
        <div className="mb-3 flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
            {user?.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{user?.fullName}</p>
            <p className="truncate text-xs text-slate-500">{user?.location}</p>
          </div>
        </div>
        {renderSidebarLinks()}
        <button onClick={() => void handleLogout()} className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
          <LogOut className="h-5 w-5" /> Log out
        </button>
      </aside>

      <aside className={`fixed inset-y-0 left-0 z-50 w-70 bg-white shadow-2xl transition-transform lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-17 items-center justify-between border-b px-4"><Link href="/dashboard"><Logo size="sm" /></Link><button className="p-2" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button></div>
        <div className="overflow-y-auto p-3">{renderSidebarLinks()}</div>
      </aside>

      <header className="sticky top-0 z-30 flex h-17 items-center border-b border-slate-200 bg-white px-3 shadow-sm sm:px-5">
        <button className="mr-1 p-2 lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></button>
        <Link href="/dashboard" className="mr-4 hidden sm:block"><Logo size="sm" /></Link>
        <form className="relative max-w-xl flex-1" onSubmit={(event) => { event.preventDefault(); if (search.trim()) router.push(`/tasks?q=${encodeURIComponent(search.trim())}`); }}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search tasks" placeholder="Search tasks, services, or people" className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100" />
        </form>
        {!isAdmin && (
          <nav className="ml-3 hidden h-full items-stretch md:flex">
            {[
              { href: '/dashboard', icon: Home, label: 'Home' },
              { href: '/messages', icon: MessageSquare, label: 'Messages' },
              { href: '/notifications', icon: Bell, label: 'Notifications' },
              { href: '/tasks', icon: Store, label: 'Marketplace' },
              { href: '/rides', icon: CarFront, label: 'Ride booking' },
            ].map((item) => (
              <Link key={item.href} href={item.href} title={item.label} className={`relative flex min-w-14.5 items-center justify-center border-b-2 px-3 ${pathname === item.href ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                <item.icon className="h-5 w-5" />
                {item.href === '/notifications' && unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />}
              </Link>
            ))}
          </nav>
        )}
        <Link href="/profile" className="ml-2 flex items-center gap-1 rounded-full border border-slate-200 p-1.5 pl-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{user?.fullName.charAt(0)}</span>
          <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
        </Link>
      </header>

      <main className="lg:pl-65">{children}</main>
    </div>
  );
}
