import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  CheckCircle, 
  Package, 
  Phone,
  ArrowRight,
  ExternalLink,
  Info,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Pickups() {
  const { currentUser } = useAuth();
  const [availablePickups, setAvailablePickups] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Listen for available pickups (accepted by NGO but not yet picked up)
    const q1 = query(collection(db, 'donations'), where('status', '==', 'accepted'));
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      setAvailablePickups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Listen for current volunteer's active tasks
    const q2 = query(collection(db, 'donations'), 
      where('volunteerId', '==', currentUser.uid),
      where('status', 'in', ['picking_up', 'on_the_way'])
    );
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      setMyTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [currentUser.uid]);

  const filteredPickups = availablePickups.filter(pickup => 
    pickup.foodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (pickup.area && pickup.area.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStartPickup = async (donationId) => {
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'picking_up',
        volunteerId: currentUser.uid,
        pickedUpAt: serverTimestamp()
      });
      toast.success('Pickup started! Navigate to the donor location.');
    } catch (err) {
      toast.error('Failed to start pickup');
    }
  };

  const handleCompleteDelivery = async (donationId) => {
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'delivered',
        deliveredAt: serverTimestamp()
      });
      
      // Update analytics
      await addDoc(collection(db, 'analytics'), {
        type: 'delivery_completed',
        volunteerId: currentUser.uid,
        donationId,
        timestamp: serverTimestamp()
      });

      toast.success('Delivery completed! Thank you for your service.');
    } catch (err) {
      toast.error('Failed to complete delivery');
    }
  };

  const openInMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Truck className="mr-2 text-primary-600" /> Delivery Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your active deliveries and find new tasks.</p>
        </div>

        {/* Active Tasks */}
        {myTasks.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold dark:text-white flex items-center">
              <Navigation className="mr-2 text-green-500" size={20} /> Your Active Tasks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myTasks.map((task) => (
                <div key={task.id} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-lg border-2 border-primary-100 dark:border-primary-900/30">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        {task.status.replace('_', ' ')}
                      </span>
                      <h3 className="text-xl font-bold mt-2 dark:text-white">{task.foodName}</h3>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                      <Package className="text-primary-500" />
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1 p-1 bg-red-50 text-red-500 rounded-md"><MapPin size={14} /></div>
                      <div>
                        <p className="text-xs text-gray-400">Pickup Location</p>
                        <p className="text-sm font-medium dark:text-gray-200 truncate w-48">{task.area || 'Donor Pickup Point'}</p>
                        <button 
                          onClick={() => openInMaps(task.location.latitude, task.location.longitude)}
                          className="text-primary-600 text-xs font-bold flex items-center mt-1"
                        >
                          Navigate <ExternalLink size={10} className="ml-1" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="mt-1 p-1 bg-blue-50 text-blue-500 rounded-md"><Navigation size={14} /></div>
                      <div>
                        <p className="text-xs text-gray-400">Drop-off Location</p>
                        <p className="text-sm font-medium dark:text-gray-200">{task.ngoName || 'NGO Destination Center'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => task.donorPhone && (window.location.href = `tel:${task.donorPhone}`)}
                      className="flex items-center justify-center space-x-2 py-3 px-4 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition-colors"
                    >
                      <Phone size={18} /> <span>Call</span>
                    </button>
                    <button 
                      onClick={() => handleCompleteDelivery(task.id)}
                      className="flex items-center justify-center space-x-2 py-3 px-4 bg-green-600 rounded-xl font-bold text-white hover:bg-green-700 transition-all shadow-lg shadow-green-200 dark:shadow-none"
                    >
                      <CheckCircle size={18} /> <span>Delivered</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Available Tasks */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-bold dark:text-white">Available for Pickup</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search food or area..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all text-sm"
              />
            </div>
          </div>
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredPickups.length > 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Food Item</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Area</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-800">
                    {filteredPickups.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mr-3 text-primary-600">
                              <Package size={20} />
                            </div>
                            <span className="font-bold dark:text-white">{item.foodName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.quantity}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <MapPin size={14} className="mr-1" />
                            <span className="text-sm">{item.area || 'Nearby'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleStartPickup(item.id)}
                            className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-700 transition-all flex items-center"
                          >
                            Accept <ArrowRight size={14} className="ml-1" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-12 text-center border-2 border-dashed dark:border-gray-800">
              <p className="text-gray-500">No pickups matching your search.</p>
            </div>
          )}
        </section>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800 flex items-start space-x-4">
          <Info className="text-blue-500 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-100">Volunteer Guidelines</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
              Always wear your FoodBridge ID, maintain hygiene standards during transport, and verify the delivery with the NGO representative using the QR code (if applicable).
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
