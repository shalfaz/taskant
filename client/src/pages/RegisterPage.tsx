import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Logo from '../components/Logo';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '', location: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.fullName) errs.fullName = 'Required';
    if (!form.email) errs.email = 'Required';
    if (!form.phone) errs.phone = 'Required';
    if (!form.location) errs.location = 'Required';
    if (form.password.length < 6) errs.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        location: form.location,
      });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 to-brand-800 p-12 items-center justify-center">
        <div className="text-white max-w-md">
          <Logo size="lg" className="[&_span]:text-white [&_span_span]:text-brand-200 mb-8" showTagline />
          <h2 className="text-3xl font-bold mb-4">Join TaskAnt</h2>
          <p className="text-brand-100">One account to post tasks and earn by helping others. No separate roles needed.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo showTagline /></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-500 mb-8">Start posting and accepting tasks today</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} />
            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
            <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} />
            <Input label="Current Location" name="location" value={form.location} onChange={handleChange} error={errors.location} placeholder="e.g. Dhaka, Pabna" />
            <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} />
            <Input label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
            <Button type="submit" loading={loading} className="w-full">Create Account</Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
