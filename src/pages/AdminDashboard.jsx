import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { seedInitialData } from '../utils/seedData';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Users, 
  Heart, 
  ShieldAlert, 
  BarChart3, 
  Search, 
  MoreVertical,
  Trash2,
  ShieldCheck,
  UserX,
  Database,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    const res = await seedInitialData();
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.error);
    }
    setSeeding(false);
  };

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubDonations = onSnapshot(collection(db, 'donations'), (snapshot) => {
      setDonations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubDonations();
    };
  }, []);

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Active Donations', value: donations.filter(d => d.status === 'available').length, icon: Heart, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'NGO Partners', value: users.filter(u => u.role === 'ngo').length, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Flagged Content', value: '2', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const roleDistribution = [
    { name: 'Donors', value: users.filter(u => u.role === 'donor').length },
    { name: 'NGOs', value: users.filter(u => u.role === 'ngo').length },
    { name: 'Volunteers', value: users.filter(u => u.role === 'volunteer').length },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="mr-2 text-primary-600" /> Admin Command Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Global system overview and moderation.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSeed}
              disabled={seeding}
              className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-amber-200 dark:shadow-none hover:bg-amber-700 transition-all flex items-center"
            >
              {seeding ? <Loader2 size={16} className="animate-spin mr-2" /> : <Database size={16} className="mr-2" />}
              Seed Initial Data
            </button>
            <button className="bg-white dark:bg-gray-800 border dark:border-gray-700 px-4 py-2 rounded-xl text-sm font-semibold dark:text-white shadow-sm hover:bg-gray-50 transition-colors">
              Download Report
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border dark:border-gray-800">
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Role Chart */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border dark:border-gray-800">
            <h3 className="text-xl font-bold dark:text-white mb-6">User Distribution</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              {roleDistribution.map((r, i) => (
                <div key={i} className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-gray-600 dark:text-gray-400">{r.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Management Table */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-xl font-bold dark:text-white">Recent Users</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Joined</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-800">
                  {users.slice(0, 5).map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                            {user.displayName?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold dark:text-white">{user.displayName || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold capitalize ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                          user.role === 'ngo' ? 'bg-blue-100 text-blue-600' :
                          user.role === 'volunteer' ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Logs */}
        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/30">
          <h4 className="font-bold text-red-900 dark:text-red-200 flex items-center mb-4">
            <ShieldAlert className="mr-2" size={20} /> Security & Moderation
          </h4>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl flex items-center justify-between border border-red-100 dark:border-red-900/20">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl"><UserX size={18} /></div>
                <div>
                  <p className="text-sm font-bold dark:text-white">Suspicious Activity Detected</p>
                  <p className="text-xs text-gray-500">Donor ID: 9x2... flagged for duplicate posts.</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="text-xs font-bold text-gray-500 hover:text-gray-700">Dismiss</button>
                <button className="text-xs font-bold text-red-600 hover:text-red-700">Investigate</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
