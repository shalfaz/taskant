import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const steps = [
  { num: '01', title: 'Create Your Account', desc: 'Sign up as a normal user. You can both post tasks and accept tasks — no separate roles needed.' },
  { num: '02', title: 'Post or Browse Tasks', desc: 'Need help? Post a task with location, budget, and deadline. Want to earn? Browse available tasks near you.' },
  { num: '03', title: 'Bid & Communicate', desc: 'Workers submit bids with their price and timeline. Posters review profiles, ratings, and verification status.' },
  { num: '04', title: 'Track Progress', desc: 'Once assigned, track task status from Assigned → In Progress → Completed with real-time updates.' },
  { num: '05', title: 'Pay & Review', desc: 'Complete demo payment after task confirmation. Leave ratings to build community trust.' },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">How It Works</h1>
        <p className="mt-4 text-gray-600">One account, two roles — post tasks or complete them</p>
      </div>
      <div className="space-y-8">
        {steps.map((step) => (
          <div key={step.num} className="flex gap-6 p-6 bg-white rounded-xl border border-gray-100">
            <span className="text-3xl font-bold text-brand-200 shrink-0">{step.num}</span>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-gray-600">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 text-center">
        <Link to="/register"><Button size="lg">Get Started Free</Button></Link>
      </div>
    </div>
  );
}
