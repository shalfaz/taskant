import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';

const navLinks = [
  { to: '/about', label: 'About' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/tasks', label: 'Browse Tasks' },
];

export default function PublicLayout() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/"><Logo size="sm" /></Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === link.to ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'}>
                  <Button size="sm">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login"><Button variant="ghost" size="sm">Log In</Button></Link>
                  <Link to="/register"><Button size="sm">Sign Up</Button></Link>
                </>
              )}
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="block text-sm font-medium text-gray-700 py-2" onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t flex gap-3">
              {user ? (
                <Link to="/dashboard" className="flex-1"><Button className="w-full" size="sm">Dashboard</Button></Link>
              ) : (
                <>
                  <Link to="/login" className="flex-1"><Button variant="outline" className="w-full" size="sm">Log In</Button></Link>
                  <Link to="/register" className="flex-1"><Button className="w-full" size="sm">Sign Up</Button></Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Logo size="sm" className="[&_span]:text-white [&_span_span]:text-brand-400" />
              <p className="mt-3 text-sm text-gray-400 max-w-sm">
                Your Task. Our Ant. Connect with trusted people who can complete your local tasks when you can't be there.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/tasks" className="hover:text-white">Browse Tasks</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white">How It Works</Link></li>
                <li><Link to="/about" className="hover:text-white">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/safety" className="hover:text-white">Safety Center</Link></li>
                <li><a href="mailto:support@taskant.com" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-500 text-center">
            © {new Date().getFullYear()} TaskAnt. University Capstone Project Demo.
          </div>
        </div>
      </footer>
    </div>
  );
}
