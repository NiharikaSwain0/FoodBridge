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
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white flex items-center">
                      <Package size={16} className="mr-2" /> Food Name
                    </label>
                    <input type="text" required className="w-full px-4 py-3 rounded-xl border dark:bg-gray-800 dark:text-white" placeholder="e.g., 10 Packs of Biryani" value={formData.foodName} onChange={(e) => setFormData({...formData, foodName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">Category</label>
                    <select className="w-full px-4 py-3 rounded-xl border dark:bg-gray-800 dark:text-white" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white flex items-center">
                      <Clock size={16} className="mr-2" /> Best Before
                    </label>
                    <input type="datetime-local" required className="w-full px-4 py-3 rounded-xl border dark:bg-gray-800 dark:text-white" value={formData.expiryTime} onChange={(e) => setFormData({...formData, expiryTime: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">Quantity</label>
                    <input type="text" required className="w-full px-4 py-3 rounded-xl border dark:bg-gray-800 dark:text-white" placeholder="e.g., 5 kg" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
                  </div>
                </div>
                <textarea rows={4} className="w-full px-4 py-3 rounded-xl border dark:bg-gray-800 dark:text-white" placeholder="Description..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <button type="button" onClick={() => setStep(2)} className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold">Next Step</button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 text-center">
                <div className="border-2 border-dashed rounded-3xl p-12 relative">
                  {imagePreview ? (
                    <img src={imagePreview} className="max-h-64 mx-auto rounded-xl" />
                  ) : (
                    <div className="py-8"><Camera size={48} className="mx-auto text-gray-400 mb-4" /><p className="dark:text-white">Click to upload photo</p></div>
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
                <button type="button" onClick={() => setStep(3)} className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold">Next Step</button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="block text-sm font-medium dark:text-white flex items-center">
                    <Search size={16} className="mr-2" /> Search Area
                  </label>
                  <div className="flex gap-2">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for address..." className="flex-grow px-4 py-3 rounded-xl border dark:bg-gray-800 dark:text-white" onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)} />
                    <button type="button" onClick={handleSearch} className="p-3 bg-primary-600 text-white rounded-xl"><Search size={20} /></button>
                    <button type="button" onClick={getCurrentLocation} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl" title="Use current location"><Navigation size={20} /></button>
                  </div>
                </div>

                <div className="h-[400px] rounded-2xl overflow-hidden border-2 relative z-0">
                  <MapContainer key={`${mapCenter[0]}-${mapCenter[1]}`} center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <MapController center={mapCenter} />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium dark:text-white">Pickup Address</label>
                  <textarea required rows={2} value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} placeholder="Detailed address..." className="w-full px-4 py-3 rounded-xl border dark:bg-gray-800 dark:text-white" />
                </div>

                <button disabled={loading} type="submit" className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold flex items-center justify-center">
                  {loading ? <Loader2 className="animate-spin" /> : 'Confirm & Post Donation'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
