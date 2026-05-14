import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { 
  Package, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight,
  Heart,
  Calendar,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Component to control map view
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 12, {
        duration: 1.5
      });
    }
  }, [center, map]);
  return null;
}

export default function NearbyDonations() {
  const { currentUser, userData } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        toast.success(`Showing: ${data[0].display_name.split(',')[0]}`);
      } else {
        toast.error("Area not found");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Error searching for area");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'donations'), where('status', '==', 'available'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDonations(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleAccept = async (donationId) => {
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'accepted',
        receiverId: currentUser.uid,
        ngoName: userData?.displayName || 'Partner NGO',
        acceptedAt: new Date().toISOString()
      });
      toast.success('Donation accepted! A volunteer will be notified.');
    } catch (err) {
      toast.error('Failed to accept donation');
    }
  };

  const filteredDonations = filter === 'all' 
    ? donations 
    : donations.filter(d => d.category === filter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find Food Donations</h1>
            <p className="text-gray-600 dark:text-gray-400">Discover surplus food available in your vicinity.</p>
          </div>
          <div className="flex items-center space-x-2">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search area..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all text-sm w-full md:w-64"
              />
            </form>
            <button className="p-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Filter size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredDonations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDonations.map((donation) => (
                  <div 
                    key={donation.id} 
                    className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    <div className="h-48 relative overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {donation.imageUrl ? (
                        <img 
                          src={donation.imageUrl} 
                          alt={donation.foodName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop';
                          }}
                        />
                      ) : (
                        <div className="text-gray-400 flex flex-col items-center">
                          <Package size={48} className="mb-2 opacity-20" />
                          <span className="text-xs font-medium opacity-50 text-center px-4">No image provided by donor</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          {donation.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{donation.foodName}</h3>
                        <span className="text-primary-600 font-bold">{donation.quantity}</span>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock size={16} className="mr-2" />
                          <span>Exp: {new Date(donation.expiryTime).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <MapPin size={16} className="mr-2" />
                          <span className="truncate">Pickup from Donor Location</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAccept(donation.id)}
                        className="w-full bg-primary-600 text-white py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all transform hover:scale-[1.02] flex items-center justify-center"
                      >
                        Accept Donation <ChevronRight className="ml-2" size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                <Package className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">No donations found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Try changing your location or category filter.</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border dark:border-gray-800 overflow-hidden h-[400px] z-0 relative">
              <MapContainer 
                center={mapCenter} 
                zoom={5} 
                style={{ height: '100%', width: '100%' }}
              >
                <MapController center={mapCenter} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {donations.map((d) => (
                  <Marker key={d.id} position={[d.location.latitude, d.location.longitude]}>
                    <Popup>
                      <div className="p-2">
                        <p className="font-bold">{d.foodName}</p>
                        <p className="text-xs">{d.quantity}</p>
                        <button 
                          onClick={() => handleAccept(d.id)}
                          className="mt-2 text-primary-600 font-bold text-xs"
                        >
                          Accept Now
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <div className="bg-primary-600 rounded-3xl p-6 text-white shadow-xl shadow-primary-200 dark:shadow-none">
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <Heart className="mr-2" size={20} /> Impact Hub
              </h3>
              <p className="text-sm opacity-90 mb-6">You've helped redistribute 450+ meals this month.</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center"><Calendar size={14} className="mr-2" /> Today</span>
                  <span className="font-bold">12 Meals</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div className="bg-white h-full w-3/4"></div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border dark:border-gray-800">
              <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center">
                <Info className="mr-2 text-primary-500" size={18} /> Quick Tips
              </h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 mr-2 flex-shrink-0"></span>
                  Accept donations within 30 mins for freshness.
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 mr-2 flex-shrink-0"></span>
                  Coordinate with volunteers for delivery timing.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
