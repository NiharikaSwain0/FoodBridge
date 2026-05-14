import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  TrendingUp, 
  Users, 
  Heart, 
  Clock, 
  ChevronRight,
  Package,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Truck,
  PlusCircle,
  Search,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { userData, currentUser } = useAuth();
  const role = userData?.role || 'donor';
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expiringSoon, setExpiringSoon] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch Expiring Soon (only for Donor and NGO)
    const fetchExpiring = async () => {
      if (role === 'admin' || role === 'volunteer') return;

      try {
        let q = query(
          collection(db, 'donations'),
          where('status', '==', 'available'),
          orderBy('expiryTime', 'asc'),
          limit(3)
        );

        try {
          const snapshot = await getDocs(q);
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setExpiringSoon(items);
        } catch (indexErr) {
          // Comprehensive check for index errors
          const isIndexError = 
            indexErr.code === 'failed-precondition' || 
            indexErr.code === 'permission-denied' ||
            (indexErr.message && indexErr.message.toLowerCase().includes('index'));

          if (isIndexError) {
            console.warn("Firestore index missing or query failed. Falling back to unordered query.");
            const fallbackQ = query(
              collection(db, 'donations'),
              where('status', '==', 'available'),
              limit(10) // Get more to sort locally
            );
            const snapshot = await getDocs(fallbackQ);
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client-side sort by expiryTime
            const sortedItems = items
              .filter(item => item.expiryTime)
              .sort((a, b) => new Date(a.expiryTime) - new Date(b.expiryTime))
              .slice(0, 3);
            setExpiringSoon(sortedItems);
          } else {
            throw indexErr;
          }
        }
      } catch (err) {
        console.error("Error fetching expiring donations:", err);
      }
    };

    // Fetch Stats based on role
    const fetchStats = async () => {
      let roleStats = [];
      const donationsRef = collection(db, 'donations');

      try {
        if (role === 'donor') {
          const q = query(donationsRef, where('donorId', '==', currentUser.uid));
          const snapshot = await getDocs(q);
          const total = snapshot.size;
          const delivered = snapshot.docs.filter(d => d.data().status === 'delivered').length;
          
          roleStats = [
            { label: 'My Donations', value: total.toString(), icon: Heart, color: 'text-red-600', bg: 'bg-red-100' },
            { label: 'Meals Saved', value: (delivered * 10).toString(), icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-100' },
            { label: 'Pending Pickups', value: snapshot.docs.filter(d => d.data().status === 'accepted').length.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
            { label: 'Impact Score', value: '9.2', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
          ];
        } else if (role === 'ngo') {
          const q = query(donationsRef, where('receiverId', '==', currentUser.uid));
          const snapshot = await getDocs(q);
          const total = snapshot.size;
          
          roleStats = [
            { label: 'Received Items', value: total.toString(), icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: 'Communities Fed', value: (total * 5).toString(), icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
            { label: 'Active Deliveries', value: snapshot.docs.filter(d => d.data().status === 'picking_up').length.toString(), icon: Truck, color: 'text-amber-600', bg: 'bg-amber-100' },
            { label: 'Local Rank', value: '#12', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
          ];
        } else if (role === 'volunteer') {
          const q = query(donationsRef, where('volunteerId', '==', currentUser.uid));
          const snapshot = await getDocs(q);
          const total = snapshot.size;
          
          roleStats = [
            { label: 'Total Deliveries', value: total.toString(), icon: Truck, color: 'text-green-600', bg: 'bg-green-100' },
            { label: 'KM Covered', value: (total * 3.5).toFixed(1), icon: MapPin, color: 'text-primary-600', bg: 'bg-primary-100' },
            { label: 'Points Earned', value: (total * 50).toString(), icon: Heart, color: 'text-red-600', bg: 'bg-red-100' },
            { label: 'Rating', value: '4.9', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
          ];
        }
        setStats(roleStats);
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    // Listen for recent activity
    let activityQuery;
    try {
      if (role === 'donor') {
        activityQuery = query(collection(db, 'donations'), where('donorId', '==', currentUser.uid), orderBy('createdAt', 'desc'), limit(5));
      } else if (role === 'ngo') {
        activityQuery = query(collection(db, 'donations'), where('receiverId', '==', currentUser.uid), orderBy('acceptedAt', 'desc'), limit(5));
      } else {
        activityQuery = query(collection(db, 'donations'), where('volunteerId', '==', currentUser.uid), orderBy('pickedUpAt', 'desc'), limit(5));
      }
    } catch (err) {
      console.error("Error setting up activity query:", err);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(activityQuery, (snapshot) => {
      setRecentActivity(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error in activity listener:", error);
      setLoading(false);
    });

    fetchExpiring();
    fetchStats();
    return () => unsubscribe();
  }, [currentUser, role]);

  const chartData = [
    { name: 'Mon', donations: 40, requests: 24 },
    { name: 'Tue', donations: 30, requests: 13 },
    { name: 'Wed', donations: 20, requests: 98 },
    { name: 'Thu', donations: 27, requests: 39 },
    { name: 'Fri', donations: 18, requests: 48 },
    { name: 'Sat', donations: 23, requests: 38 },
    { name: 'Sun', donations: 34, requests: 43 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome, {userData?.displayName || 'Partner'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Your {role} dashboard for FoodBridge redistribution.
            </p>
          </div>
          <div className="flex gap-3">
            {role === 'donor' && (
              <Link to="/donate" className="bg-primary-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary-200 dark:shadow-none hover:bg-primary-700 transition-all flex items-center">
                <PlusCircle size={18} className="mr-2" /> New Donation
              </Link>
            )}
            {role === 'ngo' && (
              <Link to="/nearby-donations" className="bg-primary-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary-200 dark:shadow-none hover:bg-primary-700 transition-all flex items-center">
                <Search size={18} className="mr-2" /> Find Food
              </Link>
            )}
            {role === 'volunteer' && (
              <Link to="/pickups" className="bg-primary-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary-200 dark:shadow-none hover:bg-primary-700 transition-all flex items-center">
                <Truck size={18} className="mr-2" /> New Pickup
              </Link>
            )}
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border dark:border-gray-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+12%</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Smart Expiry Alerts */}
        {expiringSoon.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-6 rounded-3xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center">
                <Clock className="mr-2" size={20} /> Smart Expiry Alerts
              </h3>
              <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-lg animate-pulse">Action Required</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {expiringSoon.map((item) => (
                <div key={item.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold dark:text-white truncate w-32">{item.foodName}</p>
                      <p className="text-[10px] text-gray-500">Expires: {new Date(item.expiryTime).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <Link to={role === 'donor' ? '/my-donations' : '/nearby-donations'} className="text-primary-600 hover:text-primary-700">
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border dark:border-gray-800">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold dark:text-white">Activity Overview</h3>
              <select className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-medium dark:text-gray-300 focus:ring-2 focus:ring-primary-500">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="donations" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorDonations)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border dark:border-gray-800">
            <h3 className="text-xl font-bold dark:text-white mb-6">Recent Activity</h3>
            <div className="space-y-6">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
                </div>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-primary-500`}>
                        <Package size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold dark:text-white group-hover:text-primary-600 transition-colors">{item.foodName}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.status.replace('_', ' ')} • {item.quantity}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No recent activity found.</p>
                </div>
              )}
            </div>
            <Link to={role === 'donor' ? '/my-donations' : role === 'ngo' ? '/received-donations' : '/pickups'} className="w-full mt-8 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors block text-center">
              View All History
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
