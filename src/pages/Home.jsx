import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { Heart, ShieldCheck, Truck, BarChart3, ArrowRight, CheckCircle2, Package, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, limit, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function Home() {
  const [activeDonations, setActiveDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Forcefully clear loading state after a timeout to prevent infinite skeletons
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Forcefully use a simple query that doesn't require composite indexes
    const q = query(
      collection(db, 'donations'),
      where('status', '==', 'available'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      clearTimeout(timeoutId);
      try {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const sortedDocs = docs.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        }).slice(0, 3);
        
        setActiveDonations(sortedDocs);
        setLoading(false);
      } catch (err) {
        console.error("Error processing live feed data:", err);
        setLoading(false);
      }
    }, (error) => {
      clearTimeout(timeoutId);
      console.error("Home live feed query failed:", error);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);
  const features = [
    {
      title: 'For Donors',
      description: 'Restaurants and stores can easily upload surplus food details in seconds.',
      icon: Heart,
      color: 'bg-red-100 text-red-600',
    },
    {
      title: 'For NGOs',
      description: 'Receive real-time alerts about food availability in your nearby areas.',
      icon: ShieldCheck,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'For Volunteers',
      description: 'Help deliver food from donors to NGOs and track your impact.',
      icon: Truck,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Real-time Analytics',
      description: 'Monitor food waste reduction and community impact with live data.',
      icon: BarChart3,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-white dark:bg-gray-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 
              className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight"
            >
              Feed the <span className="text-primary-600">Needy</span>, <br />
              Reduce the <span className="text-primary-600">Waste</span>
            </h1>
            <p 
              className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed"
            >
              FoodBridge is a smart redistribution system connecting surplus food from donors to NGOs and communities in real-time using advanced mapping technology.
            </p>
            <div 
              className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link to="/register" className="bg-primary-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 dark:shadow-none transform hover:scale-105 flex items-center justify-center">
                Get Started Now <ArrowRight className="ml-2" />
              </Link>
              <a href="#features" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-100 dark:border-gray-700 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center">
                Explore Features
              </a>
            </div>
          </div>
        </div>
        
        {/* Background blobs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-primary-600">50k+</p>
              <p className="text-gray-600 dark:text-gray-400">Meals Saved</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary-600">200+</p>
              <p className="text-gray-600 dark:text-gray-400">Partner NGOs</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary-600">1.2k+</p>
              <p className="text-gray-600 dark:text-gray-400">Volunteers</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary-600">15+</p>
              <p className="text-gray-600 dark:text-gray-400">Cities Active</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Our Smart Ecosystem</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We use technology to bridge the gap between food surplus and food scarcity.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="p-8 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 transition-all hover:-translate-y-2"
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">How FoodBridge Works</h2>
              <div className="space-y-6">
                {[
                  { title: 'Donor Posts Surplus', text: 'Restaurants or individuals post available food details.' },
                  { title: 'Smart Matching', text: 'System identifies nearby NGOs based on hunger heatmap.' },
                  { title: 'Volunteer Pick-up', text: 'Verified volunteers accept the delivery task.' },
                  { title: 'Safe Delivery', text: 'Food is delivered safely with QR code verification.' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">{step.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-primary-600 rounded-3xl w-full h-96 transform rotate-3 absolute inset-0 opacity-10"></div>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl relative border dark:border-gray-700 min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="font-bold dark:text-white">Active Donations</h4>
                  <div className="flex items-center bg-green-100 dark:bg-green-900/30 text-green-600 px-3 py-1 rounded-full text-xs font-bold">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Live Feed
                  </div>
                </div>
                
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                      [1, 2, 3].map((_, i) => (
                        <div key={`skeleton-${i}`} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl animate-pulse">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))
                    ) : activeDonations.length > 0 ? (
                      activeDonations.map((donation, i) => (
                        <motion.div 
                          key={donation.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30 transition-all cursor-pointer group"
                        >
                          <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                            <Package size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-gray-900 dark:text-white truncate text-sm sm:text-base">
                              {donation.foodName}
                            </h5>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              <MapPin size={12} className="mr-1" />
                              <span className="truncate">{donation.area?.split(',')[0] || 'Nearby Location'}</span>
                              <span className="mx-2 text-gray-300">•</span>
                              <span>{donation.quantity}</span>
                            </div>
                          </div>
                          <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200 dark:border-gray-700">
                          <Package className="text-gray-300" size={32} />
                        </div>
                        <h5 className="font-bold text-gray-900 dark:text-white mb-1">No Active Donations</h5>
                        <p className="text-gray-500 text-xs px-8">There are no available donations in your area right now. Check back later!</p>
                        <button 
                          onClick={() => window.location.reload()}
                          className="mt-4 text-primary-600 text-xs font-bold hover:underline"
                        >
                          Refresh Feed
                        </button>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-8 pt-6 border-t dark:border-gray-700">
                  <Link to="/register" className="text-primary-600 font-bold text-sm flex items-center justify-center hover:underline">
                    Join as a Volunteer to Help <ArrowRight size={16} className="ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
