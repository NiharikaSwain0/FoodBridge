import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  History,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function MyDonations() {
  const { currentUser } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Forcefully clear loading after a timeout
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const q = query(
      collection(db, 'donations'), 
      where('donorId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      clearTimeout(timeoutId);
      setDonations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.warn("MyDonations query failed (likely missing index). Falling back to simpler query.", error);
      
      const fallbackQ = query(
        collection(db, 'donations'), 
        where('donorId', '==', currentUser.uid)
      );

      const fallbackUnsubscribe = onSnapshot(fallbackQ, (snapshot) => {
        clearTimeout(timeoutId);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Client-side sort
        const sortedDocs = docs.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setDonations(sortedDocs);
        setLoading(false);
      });

      return () => fallbackUnsubscribe();
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [currentUser]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-blue-100 text-blue-600';
      case 'accepted': return 'bg-amber-100 text-amber-600';
      case 'picking_up': return 'bg-indigo-100 text-indigo-600';
      case 'delivered': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <History className="mr-3 text-primary-600" /> My Donation History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your contributions and their impact.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : donations.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {donations.map((donation, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={donation.id}
                className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border dark:border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {donation.imageUrl ? (
                      <img 
                        src={donation.imageUrl} 
                        alt={donation.foodName} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.target.onerror = null; 
                          e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=200&auto=format&fit=crop';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      {donation.foodName}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <Clock size={14} className="mr-1" /> Exp: {new Date(donation.expiryTime).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <Package size={14} className="mr-1" /> {donation.quantity}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(donation.status)}`}>
                    {donation.status.replace('_', ' ')}
                  </span>
                  <p className="text-xs text-gray-400">
                    Posted on {donation.createdAt?.toDate().toLocaleDateString() || 'Recently'}
                  </p>
                </div>

                <div className="md:border-l dark:border-gray-800 md:pl-6 flex items-center">
                  <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                    <ArrowUpRight size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <Package className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No donations yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Start by making your first food donation!</p>
            <button className="mt-6 bg-primary-600 text-white px-8 py-3 rounded-full font-bold hover:bg-primary-700 transition-all">
              Donate Now
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
