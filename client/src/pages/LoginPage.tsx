'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';
import { signInWithPopup } from 'firebase/auth';
import { Eye, EyeOff } from 'lucide-react';
import { auth, googleProvider } from '../../../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Logo from '../components/Logo';

export default function LoginPage() {
  const { login, socialLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGoogleLogin = async () => {
    if (!auth) {
      toast.error('Google sign-in is not configured yet. Please check your Firebase environment variables.');
      return;
    }

    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      if (!firebaseUser.email) {
        toast.error('Your Google account did not return an email address.');
        return;
      }
      const user = await socialLogin({
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        avatar: firebaseUser.photoURL,
        provider: 'google',
      });
      toast.success('Welcome back!');
      router.push(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: unknown) {
      const firebaseCode = (err as { code?: string })?.code;
      if (firebaseCode === 'auth/popup-closed-by-user' || firebaseCode === 'auth/cancelled-popup-request') {
        return;
      }
      const responseMessage = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      const msg =
        responseMessage ||
        (firebaseCode === 'auth/popup-blocked'
          ? 'Sign-in popup was blocked by your browser. Please allow popups and try again.'
          : err instanceof Error
            ? err.message
            : 'Google sign-in failed');
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    toast('Facebook login will be enabled soon — please continue with Google or Email.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Email is required';
    if (!password) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      toast.success('Welcome back!');
      router.push(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: unknown) {
      const responseMessage = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      const msg =
        responseMessage ||
        (axios.isAxiosError(err) && !err.response
          ? 'Unable to reach the server. Check your connection and try again.'
          : err instanceof Error
            ? err.message
            : 'Login failed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <div className="relative hidden overflow-hidden bg-linear-to-br from-[#EEF4FF] via-[#F4F7FB] to-[#FFF8F1] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_85%_82%,rgba(234,88,12,0.08),transparent_38%)]" />

        <div className="relative flex flex-col items-start">
          <Logo size="lg" />
          <p className="mt-1.5 text-xs font-medium text-slate-500">Your Task. Our Ant.</p>
        </div>

        <div className="relative max-w-xl py-12">
          <h2 className="text-5xl font-extrabold leading-tight tracking-tight text-slate-900">
            Get things done.
            <br />
            <span className="text-orange-600">Help your community.</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
            Post a task when you need support, or earn by accepting work from people nearby.
          </p>
        </div>

        <div className="relative space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
            Your local task network
          </p>
          <p className="text-sm text-slate-500">One account. Every opportunity.</p>
        </div>
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 sm:p-10 lg:border-l lg:border-slate-200">
        <div className="mx-auto w-full max-w-100">
          <div className="mb-8 flex flex-col items-start lg:hidden">
            <Logo />
            <p className="mt-1.5 text-xs font-medium text-slate-500">Your Task. Our Ant.</p>
          </div>

          <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
            Sign in to TaskAnt
          </h1>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              aria-label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="Email address"
              className="rounded-xl py-3 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />

            <div className="w-full">
              <div className="relative">
                <input
                  id="login-password"
                  aria-label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={`w-full rounded-xl border px-3.5 py-3 pr-11 text-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              loading={loading}
              className="mt-1 w-full rounded-full! bg-orange-600! py-3! font-semibold text-white shadow-sm hover:bg-orange-700!"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => toast('Please contact support@taskant.com to reset your password.')}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Forgot password?
            </button>
          </div>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              disabled={googleLoading || loading}
              onClick={() => void handleGoogleLogin()}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-orange-600" />
              ) : (
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </button>

            <button
              type="button"
              disabled={googleLoading || loading}
              onClick={handleFacebookLogin}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#1877F2"
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
              Continue with Facebook
            </button>

            <Link
              href="/register"
              className="block w-full rounded-full border border-orange-600 py-2.5 text-center text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50"
            >
              Create new account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
