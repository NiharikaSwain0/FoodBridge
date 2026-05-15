import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ensure L is on window for plugins that expect it
if (typeof window !== 'undefined') {
  window.L = L;
}

import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import DashboardLayout from '../layouts/DashboardLayout';
import { AlertCircle, Map as MapIcon, Info, Database, Search, RefreshCw } from 'lucide-react';
import { seedInitialData } from '../utils/seedData';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// Component to handle heatmap layer
function HeatmapLayer({ data }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !data || data.length === 0) return;

    // Convert data to [lat, lng, intensity]
    const points = data
      .filter(p => p?.location?.latitude && p?.location?.longitude)
      .map(p => [p.location.latitude, p.location.longitude, p.hungerScore || 0.5]);

    if (points.length === 0) return;

    // Remove existing heat layers
    map.eachLayer(layer => {
      if (layer.options && layer.options.radius && !layer.getLatLng) { 
        map.removeLayer(layer);
      }
    });

    try {
      const leaflet = window.L || L;
      if (!leaflet.heatLayer) return;
      
      const heatLayer = leaflet.heatLayer(points, {
        radius: 30,
        blur: 20,
        maxZoom: 5,
        max: 1.0,
        minOpacity: 0.5,
        gradient: {
          0.1: '#00ff00',
          0.3: '#aaff00',
          0.5: '#ffff00',
          0.7: '#ffaa00',
          0.9: '#ff0000',
          1.0: '#8b0000'
        }
      }).addTo(map);

      return () => {
        if (map && map.hasLayer(heatLayer)) {
          map.removeLayer(heatLayer);
        }
      };
    } catch (error) {
      console.error("Heatmap error:", error);
    }
  }, [map, data]);

  return null;
}

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 12, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function Heatmap() {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [heatReady, setHeatReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);
  const [searching, setSearching] = useState(false);

  const fetchHeatmapData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'heatmapData'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHeatmapData(data.sort((a, b) => (b.hungerScore || 0) - (a.hungerScore || 0)));
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data?.[0]) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        setMapZoom(12);
        toast.success(`Found: ${data[0].display_name.split(',')[0]}`);
      } else {
        toast.error("Not found");
      }
    } catch (error) {
      toast.error("Search error");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    import('leaflet.heat').then(() => setHeatReady(true)).catch(() => setHeatReady(true));
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'heatmapData'));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHeatmapData(data.sort((a, b) => (b.hungerScore || 0) - (a.hungerScore || 0)));
      setLoading(false);
    });
  }, []);

  const urgentAreas = heatmapData.filter(p => (p.hungerScore || 0) >= 0.7 && p.location?.latitude).slice(0, 3);
  const mediumAreas = heatmapData.filter(p => (p.hungerScore || 0) >= 0.4 && (p.hungerScore || 0) < 0.7 && p.location?.latitude).slice(0, 3);
  const sufficientAreas = heatmapData.filter(p => (p.hungerScore || 0) < 0.4 && p.location?.latitude).slice(0, 3);

  const getIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  });

  const getUrgentIcon = () => L.divIcon({
    className: 'custom-div-icon',
    html: `<div class='animate-pulse-slow' style='background-color:#ef4444; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px rgba(239,68,68,0.5)'></div>`,
    iconSize: [15, 15],
    iconAnchor: [7, 7]
  });

  const urgentIcon = getUrgentIcon();
  const mediumIcon = getIcon('gold');
  const sufficientIcon = getIcon('green');

  if (loading || !heatReady) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <MapIcon className="mr-2 text-primary-600" size={28} /> Hunger Heatmap
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Real-time visualization of food demand and supply priority zones.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <form onSubmit={handleSearch} className="relative flex-grow sm:flex-grow-0">
              <input
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search location..."
                className="w-full sm:w-64 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-full py-2 pl-4 pr-10 text-sm focus:ring-2 focus:ring-primary-500 dark:text-gray-200"
              />
              <button type="submit" disabled={searching} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600">
                <Search size={18} />
              </button>
            </form>

            <button onClick={fetchHeatmapData} className="p-2 bg-white dark:bg-gray-800 rounded-full border dark:border-gray-700 shadow-sm">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            
            <button onClick={async () => {
              setSeeding(true);
              const res = await seedInitialData();
              setSeeding(false);
              res.success ? toast.success(res.message) : toast.error(res.error);
            }} disabled={seeding} className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-full shadow-sm disabled:opacity-50">
              <Database size={16} className="mr-2" /> {seeding ? 'Seeding...' : 'Seed Data'}
            </button>

            <div className="flex items-center bg-white dark:bg-gray-800 px-3 py-2 rounded-full border dark:border-gray-700 shadow-sm text-xs">
              <span className="relative flex h-2 w-2 mr-2"><span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative h-2 w-2 rounded-full bg-red-500"></span></span>
              Urgent
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-3">
            <div className="rounded-2xl overflow-hidden shadow-xl border dark:border-gray-800 relative bg-gray-100" style={{ height: '600px' }}>
              <MapContainer key={`${mapCenter[0]}-${mapCenter[1]}-${heatmapData.length}`} center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
                <MapController center={mapCenter} zoom={mapZoom} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <HeatmapLayer data={heatmapData} />
                {urgentAreas.map(area => (
                  area.location && area.location.latitude && area.location.longitude && (
                    <Marker 
                      key={area.id} 
                      position={[area.location.latitude, area.location.longitude]}
                      icon={urgentIcon}
                    >
                      <Popup>
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="p-1"
                        >
                          <h4 className="font-bold text-gray-900">{area.area || 'Unknown Area'}</h4>
                          <p className="text-sm text-red-600 font-semibold">Hunger Score: {area.hungerScore}</p>
                          <div className="mt-2 flex items-center text-[10px] text-red-500 font-bold animate-pulse">
                            <AlertCircle size={10} className="mr-1" /> URGENT ASSISTANCE NEEDED
                          </div>
                        </motion.div>
                      </Popup>
                    </Marker>
                  )
                ))}
                {mediumAreas.map(area => (
                  <Marker key={area.id} position={[area.location.latitude, area.location.longitude]} icon={mediumIcon}>
                    <Popup><div className="p-1"><h4 className="font-bold">{area.area || 'Medium'}</h4><p className="text-yellow-600">Score: {area.hungerScore}</p></div></Popup>
                  </Marker>
                ))}
                {sufficientAreas.map(area => (
                  <Marker key={area.id} position={[area.location.latitude, area.location.longitude]} icon={sufficientIcon}>
                    <Popup><div className="p-1"><h4 className="font-bold">{area.area || 'Sufficient'}</h4><p className="text-green-600">Score: {area.hungerScore}</p></div></Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border dark:border-gray-800">
              <h3 className="font-bold flex items-center mb-4"><Info className="mr-2 text-primary-500" size={18} /> How it works</h3>
              <div className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                <p>Score = Requests / (Donations + 1)</p>
                <ul className="list-disc pl-4">
                  <li>Red: High demand</li>
                  <li>Gold: Moderate</li>
                  <li>Green: Sufficient</li>
                </ul>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-2xl border border-primary-100 dark:border-primary-800">
              <h3 className="font-bold flex items-center mb-2"><AlertCircle className="mr-2" size={18} /> Urgent Needs</h3>
              <p className="text-sm mb-4">{urgentAreas.length} high-priority zones.</p>
              <div className="space-y-3">
                {urgentAreas.map((area, i) => (
                  <motion.div key={area.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (i * 0.1) }} className="bg-white dark:bg-gray-800 p-3 rounded-xl border">
                    <div className="flex justify-between text-sm font-bold mb-1"><span>{area.area}</span><span className="text-red-500">{area.hungerScore}</span></div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(area.hungerScore || 0) * 100}%` }} transition={{ duration: 1 }} className="bg-red-500 h-full"></motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
