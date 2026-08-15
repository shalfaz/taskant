import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ListTodo, CheckSquare, Bell, DollarSign, Star } from 'lucide-react';
import { dashboardApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardBody, LoadingSpinner } from '../components/ui/Card';
import TaskCard from '../components/TaskCard';
import Button from '../components/ui/Button';
import { formatCurrency } from '../utils/format';
import type { Task, Bid, DashboardStats } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{
    stats: DashboardStats;
    recentPosted: Task[];
    recentAccepted: Task[];
    availableTasks: Task[];
    pendingBids: (Bid & { task?: Task })[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get().then((res) => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const { stats } = data;
  const statCards = [
    { label: 'Posted Tasks', value: stats.postedCount, icon: ListTodo, color: 'bg-blue-50 text-blue-600' },
    { label: 'Accepted Tasks', value: stats.acceptedCount, icon: CheckSquare, color: 'bg-green-50 text-green-600' },
    { label: 'Pending Bids', value: stats.pendingBids, icon: Bell, color: 'bg-purple-50 text-purple-600' },
    { label: 'Earnings', value: formatCurrency(stats.earnings), icon: DollarSign, color: 'bg-brand-50 text-brand-600' },
    { label: 'Spending', value: formatCurrency(stats.spending), icon: DollarSign, color: 'bg-orange-50 text-orange-600' },
    { label: 'Rating', value: `${user?.rating.toFixed(1)} ⭐`, icon: Star, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.fullName.split(' ')[0]}!</h2>
          <p className="text-gray-500 mt-1">Manage your posted tasks, accepted work, and earnings</p>
        </div>
        <Link to="/post-task"><Button><PlusCircle className="w-4 h-4" /> Post a Task</Button></Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardBody className="!py-4">
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">My Posted Tasks</h3>
            <Link to="/my-tasks/posted" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          <CardBody>
            {data.recentPosted.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No tasks posted yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentPosted.map((t) => (
                  <Link key={t._id} to={`/tasks/${t._id}`} className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                    <p className="font-medium text-sm">{t.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{t.status} · {t.location}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">My Accepted Tasks</h3>
            <Link to="/my-tasks/accepted" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          <CardBody>
            {data.recentAccepted.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No accepted tasks yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentAccepted.map((t) => (
                  <Link key={t._id} to={`/tasks/${t._id}`} className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                    <p className="font-medium text-sm">{t.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{t.status} · {t.location}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {data.pendingBids.length > 0 && (
        <Card>
          <div className="px-6 py-4 border-b"><h3 className="font-semibold">Pending Bids</h3></div>
          <CardBody>
            <div className="space-y-3">
              {data.pendingBids.map((b) => (
                <Link key={b._id} to={`/tasks/${b.taskId}`} className="flex justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                  <div>
                    <p className="font-medium text-sm">{b.task?.title}</p>
                    <p className="text-xs text-gray-500">Your bid: {formatCurrency(b.amount)}</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full h-fit">Pending</span>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Available Tasks Near You</h3>
          <Link to="/tasks" className="text-sm text-brand-600 hover:underline">Browse all</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {data.availableTasks.map((t) => <TaskCard key={t._id} task={t} />)}
        </div>
      </div>
    </div>
  );
}
