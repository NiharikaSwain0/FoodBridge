import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import DashboardLayout from '../layouts/DashboardLayout';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Camera, 
  MapPin, 
  Clock, 
  Package, 
  FileText, 
  ChevronRight, 
  ArrowLeft,
  Loader2,
  Search,
  Navigation
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { motion, AnimatePresence } from 'framer-motion';

// Fix for default Leaflet icon issue in React/Vite
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? <Marker position={position} icon={defaultIcon} /> : null;
}

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function DonateFood() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    foodName: '',
    quantity: '',
    category: 'Cooked Food',
    expiryTime: '',
    description: '',
    area: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [position, setPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setMapCenter([newPos.lat, newPos.lng]);
        setPosition(newPos);
        setFormData(prev => ({ ...prev, area: display_name }));
        toast.success(`Found: ${display_name.split(',')[0]}`);
      } else {
        toast.error("Location not found");
      }
    } catch (error) {
      toast.error("Error searching for location");
    } finally {
      setSearching(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    
    setSearching(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setMapCenter([newPos.lat, newPos.lng]);
      setPosition(newPos);
      setSearching(false);
      toast.success("Location updated to your current position");
    }, () => {
      setSearching(false);
      toast.error("Unable to retrieve your location");
    });
  };

  const categories = ['Cooked Food', 'Raw Ingredients', 'Grocery Items', 'Bakery', 'Fruits/Vegetables'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) return toast.error('Please select a pickup location on the map');
    
    setLoading(true);
    const toastId = toast.loading('Posting your donation...');
    
    try {
      console.log("Starting donation submission...");
      
      // Default category images as fallbacks
      const categoryFallbacks = {
        'Cooked Food': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400',
        'Raw Ingredients': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=400',
        'Grocery Items': 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=400',
        'Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400',
        'Fruits/Vegetables': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=400'
      };

      let imageUrl = categoryFallbacks[formData.category] || categoryFallbacks['Cooked Food'];
      
      if (image) {
        console.log("Attempting image upload...");
        try {
          const imageRef = ref(storage, `donations/${Date.now()}_${image.name}`);
          const uploadPromise = uploadBytes(imageRef, image);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout')), 8000)
          );
          
          const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
          imageUrl = await getDownloadURL(uploadResult.ref);
          console.log("Image uploaded successfully:", imageUrl);
        } catch (imgErr) {
          console.error("Image upload failed, using high-quality category fallback:", imgErr);
          toast.error("Upload blocked by CORS. Using a high-quality placeholder for now.", { 
            id: toastId,
            duration: 3000 
          });
        }
      }

      console.log("Adding document to Firestore...");
      const docData = {
        ...formData,
        imageUrl,
        location: {
          latitude: position.lat,
          longitude: position.lng,
        },
        donorId: currentUser.uid,
        donorPhone: userData?.phoneNumber || '',
        donorName: userData?.displayName || '',
        status: 'available',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'donations'), docData);
      console.log("Document added successfully");

      // Create notification for NGOs
      try {
        await addDoc(collection(db, 'notifications'), {
          title: 'New Food Donation!',
          message: `${formData.foodName} is available in ${formData.area.split(',')[0]}`,
          type: 'donation',
          targetRole: 'ngo',
          createdAt: serverTimestamp(),
          readBy: []
        });
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }

      toast.success('Food donation posted successfully!', { id: toastId });
      
      // Delay navigation slightly to ensure toast is seen
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      console.error('Full submission error:', err);
      toast.error(`Failed to post donation: ${err.message}`, { id: toastId });
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600"
          >
            <ArrowLeft className="mr-2" size={20} /> Back
          </button>
          <div className="flex space-x-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-8 h-1.5 rounded-full ${step >= s ? 'bg-primary-600' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border dark:border-gray-800">
          <div className="p-8 border-b dark:border-gray-800 bg-gray-50/50">
            <h1 className="text-2xl font-bold dark:text-white">
              {step === 1 ? 'Food Details' : step === 2 ? 'Upload Image' : 'Pickup Location'}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-white flex items-center">
                        <Package size={16} className="mr-2 text-primary-500" /> Food Name
                      </label>
                      <input type="text" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all" placeholder="e.g., 10 Packs of Biryani" value={formData.foodName} onChange={(e) => setFormData({...formData, foodName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-white">Category</label>
                      <select className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-white flex items-center">
                        <Clock size={16} className="mr-2 text-primary-500" /> Best Before
                      </label>
                      <input type="datetime-local" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all" value={formData.expiryTime} onChange={(e) => setFormData({...formData, expiryTime: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-white">Quantity</label>
                      <input type="text" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all" placeholder="e.g., 5 kg" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
                    </div>
                  </div>
                  <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all" placeholder="Tell us more about the food..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button" 
                    onClick={() => setStep(2)} 
                    className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-200 dark:shadow-none hover:bg-primary-700 transition-all"
                  >
                    Next Step
                  </motion.button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 text-center"
                >
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-12 relative group hover:border-primary-500 transition-colors">
                    {imagePreview ? (
                      <motion.img 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        src={imagePreview} 
                        className="max-h-64 mx-auto rounded-xl shadow-lg" 
                      />
                    ) : (
                      <div className="py-8">
                        <Camera size={48} className="mx-auto text-gray-400 mb-4 group-hover:text-primary-500 transition-colors" />
                        <p className="dark:text-white font-medium">Click or drag to upload food photo</p>
                        <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImage(file);
                        const r = new FileReader();
                        r.onload = () => setImagePreview(r.result);
                        r.readAsDataURL(file);
                      }
                    }} accept="image/*" />
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button" 
                    onClick={() => setStep(3)} 
                    className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-200 dark:shadow-none hover:bg-primary-700 transition-all"
                  >
                    Next Step
                  </motion.button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <label className="block text-sm font-medium dark:text-white flex items-center">
                      <Search size={16} className="mr-2 text-primary-500" /> Search Area
                    </label>
                    <div className="flex gap-2">
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for address..." className="flex-grow px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all" onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)} />
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button" 
                        onClick={handleSearch} 
                        className="p-3 bg-primary-600 text-white rounded-xl shadow-md hover:bg-primary-700 transition-all"
                      >
                        <Search size={20} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button" 
                        onClick={getCurrentLocation} 
                        className="p-3 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-200 transition-all" 
                        title="Use current location"
                      >
                        <Navigation size={20} />
                      </motion.button>
                    </div>
                  </div>

                  <div className="h-[400px] rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-800 relative z-0 shadow-inner">
                    <MapContainer key={`${mapCenter[0]}-${mapCenter[1]}`} center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <MapController center={mapCenter} />
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker position={position} setPosition={setPosition} />
                    </MapContainer>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium dark:text-white flex items-center">
                      <MapPin size={16} className="mr-2 text-primary-500" /> Pickup Address
                    </label>
                    <textarea required rows={2} value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} placeholder="Detailed address (House no, building name, landmark)..." className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all" />
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading} 
                    type="submit" 
                    className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold flex items-center justify-center shadow-lg shadow-primary-200 dark:shadow-none hover:bg-primary-700 transition-all"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'Confirm & Post Donation'}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
