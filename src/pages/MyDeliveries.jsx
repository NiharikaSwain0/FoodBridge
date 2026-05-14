import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Package, 
  CheckCircle2,
  Calendar,
  History,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyDeliveries() {
  const { currentUser } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Safety timeout
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Query for delivered items by this volunteer
    const q = query(
      collection(db, 'donations'), 
      where('volunteerId', '==', currentUser.uid),
      where('status', '==', 'delivered'),
      orderBy('deliveredAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      clearTimeout(timeoutId);
      setDeliveries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.warn("MyDeliveries query failed (index missing), falling back.", error);
      
      const fallbackQ = query(
        collection(db, 'donations'), 
        where('volunteerId', '==', currentUser.uid),
        where('status', '==', 'delivered')
      );

      const fallbackUnsubscribe = onSnapshot(fallbackQ, (snapshot) => {
        clearTimeout(timeoutId);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sortedDocs = docs.sort((a, b) => (b.deliveredAt?.seconds || 0) - (a.deliveredAt?.seconds || 0));
        setDeliveries(sortedDocs);
        setLoading(false);
      });

      return () => fallbackUnsubscribe();
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [currentUser]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <History className="mr-2 text-primary-600" /> My Delivery History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your completed food redistribution tasks and their impact.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Loading history...</p>
          </div>
        ) : deliveries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {deliveries.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border dark:border-gray-800 hover:shadow-md transition-shadow group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl text-green-600">
                      <Package size={24} />
                    </div>
                    <div className="flex items-center bg-green-50 dark:bg-green-900/30 text-green-600 px-3 py-1 rounded-full text-xs font-bold">
                      <CheckCircle2 size={14} className="mr-1" /> Delivered
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.foodName}</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <MapPin size={16} className="mr-2 text-primary-500" />
                      <span className="truncate">{item.area || 'Pickup Point'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Truck size={16} className="mr-2 text-primary-500" />
                      <span>{item.ngoName || 'NGO Partner'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar size={16} className="mr-2 text-primary-500" />
                      <span>{item.deliveredAt?.seconds ? new Date(item.deliveredAt.seconds * 1000).toLocaleDateString() : 'Recently'}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t dark:border-gray-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase">Quantity</span>
                    <span className="text-sm font-bold dark:text-white">{item.quantity}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="text-gray-300" size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No deliveries yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
              You haven't completed any deliveries yet. Head over to the Pickups tab to find food that needs to be moved!
            </p>
          </div>
        )}

        <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-3xl border border-primary-100 dark:border-primary-800 flex items-start space-x-4">
          <Info className="text-primary-500 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-primary-900 dark:text-primary-100">Impact Tracking</h4>
            <p className="text-sm text-primary-700 dark:text-primary-300 mt-1 leading-relaxed">
              Every delivery you complete helps reduce food waste and feeds someone in need. Your points and rating are updated automatically after each successful drop-off.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
