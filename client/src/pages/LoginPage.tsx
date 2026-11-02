'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Logo from '../components/Logo';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email) errs.email = 'Email is required';
    if (!password) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Welcome back!');
      router.push(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <div className="relative hidden overflow-hidden bg-slate-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.22),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(249,115,22,0.12),transparent_28%)]" />
        <Logo size="lg" className="relative [&_span]:text-white [&_span_span]:text-brand-200" showTagline />
        <div className="relative max-w-xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Your local task network</p>
          <h2 className="text-5xl font-extrabold leading-tight text-white">Get things done.<br /><span className="text-orange-500">Help your community.</span></h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">Post a task when you need support, or earn by accepting work from people nearby.</p>
        </div>
        <p className="relative text-sm text-slate-500">One account. Every opportunity.</p>
      </div>
      <div className="flex min-h-screen items-center justify-center bg-white p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo showTagline /></div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Welcome back</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Sign in to TaskAnt</h1>
          <p className="mb-8 mt-2 text-sm text-slate-500">Access your marketplace, tasks, bids, and messages.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} placeholder="you@example.com" />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} placeholder="••••••••" />
            <Button type="submit" loading={loading} className="w-full">Sign In</Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account? <Link href="/register" className="text-brand-600 font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
