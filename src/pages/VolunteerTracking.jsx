import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import DashboardLayout from '../layouts/DashboardLayout';
import { Truck, MapPin, Navigation, Info, Clock, AlertTriangle } from 'lucide-react';

// Custom icon for volunteer
const volunteerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
  iconSize: [35, 35],
});

export default function VolunteerTracking() {
  const [position, setPosition] = useState([20.5937, 78.9629]);
  const [donorPos] = useState([20.6100, 78.9800]);
  const [ngoPos] = useState([20.5800, 78.9500]);

  // Simulate movement
  useEffect(() => {
    const interval = setInterval(() => {
      setPosition(prev => [
        prev[0] + (Math.random() - 0.5) * 0.001,
        prev[1] + (Math.random() - 0.5) * 0.001
      ]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Navigation className="mr-2 text-primary-600" /> Live Delivery Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Real-time status of food redistribution tasks.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 h-[600px] rounded-3xl overflow-hidden border dark:border-gray-800 shadow-xl z-0">
            <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              <Marker position={donorPos}>
                <Popup>Pickup Point (Donor)</Popup>
              </Marker>
              
              <Marker position={ngoPos}>
                <Popup>Drop-off Point (NGO)</Popup>
              </Marker>
              
              <Marker position={position} icon={volunteerIcon}>
                <Popup>Volunteer (On the way)</Popup>
              </Marker>

              <Polyline 
                positions={[donorPos, ngoPos]} 
                color="#0ea5e9" 
                dashArray="10, 10" 
                weight={3}
                opacity={0.5}
              />
            </MapContainer>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border dark:border-gray-800">
              <h3 className="font-bold dark:text-white mb-4">Delivery Status</h3>
              <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-800">
                <div className="flex items-start space-x-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center ring-4 ring-white dark:ring-gray-900">
                    <CheckCircle className="text-white" size={12} />
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-white">Order Accepted</p>
                    <p className="text-xs text-gray-500">10:30 AM</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center ring-4 ring-white dark:ring-gray-900">
                    <CheckCircle className="text-white" size={12} />
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-white">Picked Up</p>
                    <p className="text-xs text-gray-500">11:15 AM</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center ring-4 ring-white dark:ring-gray-900 animate-pulse">
                    <Truck className="text-white" size={12} />
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-white">In Transit</p>
                    <p className="text-xs text-primary-600 font-bold">Arriving in 8 mins</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-3xl border border-primary-100 dark:border-primary-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                  <Truck size={24} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-primary-600 font-bold">Volunteer</p>
                  <p className="font-bold dark:text-white">Alex Johnson</p>
                </div>
              </div>
              <button className="w-full bg-white dark:bg-gray-800 py-3 rounded-2xl font-bold text-sm shadow-sm hover:shadow-md transition-all">
                Contact Volunteer
              </button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-3xl border border-amber-100 dark:border-amber-800 flex items-start space-x-3">
              <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Heavy traffic reported on Main St. Delivery might be delayed by 5-10 mins.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function CheckCircle({ size, className }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
