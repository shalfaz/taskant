import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, PlusCircle, ListTodo, CheckSquare, Search,
  MessageSquare, Bell, CreditCard, Star, Shield, User, Menu, X, LogOut, Settings
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { notificationsApi } from '../services/api';

const userLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/post-task', icon: PlusCircle, label: 'Post a Task' },
  { to: '/my-tasks/posted', icon: ListTodo, label: 'My Posted Tasks' },
  { to: '/my-tasks/accepted', icon: CheckSquare, label: 'My Accepted Tasks' },
  { to: '/tasks', icon: Search, label: 'Browse Tasks' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/reviews', icon: Star, label: 'Reviews' },
  { to: '/safety', icon: Shield, label: 'Safety Center' },
  { to: '/profile', icon: User, label: 'My Profile' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard' },
  { to: '/admin/users', icon: User, label: 'Manage Users' },
  { to: '/admin/tasks', icon: ListTodo, label: 'Manage Tasks' },
  { to: '/admin/verifications', icon: Shield, label: 'Verifications' },
  { to: '/admin/reports', icon: Shield, label: 'Reports' },
];

export default function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const links = isAdmin ? adminLinks : userLinks;

  useEffect(() => {
    if (user && !isAdmin) {
      notificationsApi.list().then((res) => setUnread(res.data.unreadCount)).catch(() => {});
    }
  }, [user, isAdmin, location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          <Link to="/"><Logo size="sm" /></Link>
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {links.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {link.label}
                {link.to === '/notifications' && unread > 0 && (
                  <span className="ml-auto bg-brand-600 text-white text-xs rounded-full px-2 py-0.5">{unread}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-700">
              {user?.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.location}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-8">
          <button className="lg:hidden p-2 mr-2" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 capitalize">
            {links.find((l) => l.to === location.pathname)?.label || 'TaskAnt'}
          </h1>
        </header>
        <main className="p-4 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
