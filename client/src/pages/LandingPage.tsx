import { Link } from 'react-router-dom';
import { MapPin, Shield, Star, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import TaskCard from '../components/TaskCard';
import { tasksApi } from '../services/api';
import type { Task } from '../types';
import { LoadingSpinner } from '../components/ui/Card';

const categories = [
  { name: 'Document & Office Work', icon: '📄' },
  { name: 'Parcel & Delivery', icon: '📦' },
  { name: 'Shopping & Purchase', icon: '🛒' },
  { name: 'Academic Services', icon: '🎓' },
  { name: 'Local Errands', icon: '🏃' },
  { name: 'Government Assistance', icon: '🏛️' },
];

const steps = [
  { step: '1', title: 'Post Your Task', desc: 'Describe what you need done and where.' },
  { step: '2', title: 'Receive Bids', desc: 'Local helpers submit offers with their price.' },
  { step: '3', title: 'Choose & Connect', desc: 'Select a verified worker and chat directly.' },
  { step: '4', title: 'Task Completed', desc: 'Track progress, pay securely, and rate.' },
];

export default function LandingPage() {
  const [featured, setFeatured] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tasksApi.featured().then((res) => setFeatured(res.data.tasks)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <p className="text-brand-600 font-semibold text-sm mb-4">Your Task. Our Ant.</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Can't Be There?<br />
                <span className="text-brand-600">Let Someone Nearby Handle It.</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-lg">
                TaskAnt connects you with trusted people who can complete your local tasks when you can't be there yourself.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/register"><Button size="lg">Post a Task <ArrowRight className="w-5 h-5" /></Button></Link>
                <Link to="/tasks"><Button variant="outline" size="lg">Find a Task</Button></Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Verified Users</span>
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-500" /> Safe & Secure</span>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="space-y-4">
                  {['Collect certificate from Pabna', 'Receive parcel at post office', 'Submit documents locally'].map((t, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{t}</p>
                        <p className="text-xs text-gray-500">Pabna, Bangladesh</p>
                      </div>
                      <span className="ml-auto text-brand-600 font-semibold text-sm">৳{500 + i * 200}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How TaskAnt Works</h2>
            <p className="mt-3 text-gray-600">Simple steps to get your tasks done</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-brand-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">{s.step}</div>
                <h3 className="font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Popular Task Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link key={cat.name} to="/tasks" className="bg-white rounded-xl p-5 text-center border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all">
                <span className="text-3xl">{cat.icon}</span>
                <p className="mt-3 text-sm font-medium text-gray-700">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tasks */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Tasks</h2>
            <Link to="/tasks" className="text-brand-600 font-medium text-sm hover:underline">View all →</Link>
          </div>
          {loading ? <LoadingSpinner /> : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((task) => <TaskCard key={task._id} task={task} />)}
            </div>
          )}
        </div>
      </section>

      {/* Why TaskAnt */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Trust & Safety', desc: 'Verified users, reporting system, and demo escrow payments.' },
              { icon: MapPin, title: 'Location-Based', desc: 'Find helpers exactly where you need them across Bangladesh.' },
              { icon: Star, title: 'Rated Community', desc: 'Reviews and ratings ensure quality service every time.' },
            ].map((item) => (
              <div key={item.title} className="text-center p-6">
                <item.icon className="w-10 h-10 text-brand-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-600">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="mt-4 text-brand-100">Join TaskAnt today and experience hassle-free local task assistance.</p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/register"><Button variant="secondary" size="lg">Create Free Account</Button></Link>
            <Link to="/how-it-works"><Button variant="outline" size="lg" className="!border-white !text-white hover:!bg-white/10">Learn More</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
