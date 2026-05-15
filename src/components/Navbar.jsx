import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, User, LogOut, Bell, Sun, Moon, CheckCircle2, Info, Package } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (!currentUser || !userData?.role) return;

    const q = query(
      collection(db, 'notifications'),
      where('targetRole', 'in', ['all', userData.role]),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.readBy?.includes(currentUser.uid)).length);
    });

    return unsubscribe;
  }, [currentUser, userData?.role]);

  const markAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.readBy?.includes(currentUser.uid));
    for (const notif of unreadNotifs) {
      const notifRef = doc(db, 'notifications', notif.id);
      await updateDoc(notifRef, {
        readBy: [...(notif.readBy || []), currentUser.uid]
      });
    }
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const navLinks = [
    { name: 'Home', path: '/', roles: ['all'] },
    { name: 'Donate', path: '/donate', roles: ['donor'] },
    { name: 'Nearby', path: '/nearby-donations', roles: ['ngo'] },
    { name: 'Heatmap', path: '/heatmap', roles: ['all'] },
  ];

  const filteredNavLinks = navLinks.filter(link => 
    link.roles.includes('all') || (userData?.role && link.roles.includes(userData.role))
  );

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-primary-600">FoodBridge</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {filteredNavLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {currentUser ? (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button 
                    onClick={() => {
                      setIsNotificationsOpen(!isNotificationsOpen);
                      if (!isNotificationsOpen) markAsRead();
                    }}
                    className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 relative"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 z-[100] overflow-hidden"
                      >
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                          <h5 className="font-bold text-sm dark:text-white">Notifications</h5>
                          <span className="text-[10px] bg-primary-100 dark:bg-primary-900 text-primary-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Live</span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map((notif) => (
                              <div 
                                key={notif.id} 
                                className={`p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${!notif.readBy?.includes(currentUser.uid) ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                              >
                                <div className="flex space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    notif.type === 'donation' ? 'bg-orange-100 text-orange-600' : 
                                    notif.type === 'acceptance' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                  }`}>
                                    {notif.type === 'donation' ? <Package size={14} /> : 
                                     notif.type === 'acceptance' ? <Info size={14} /> : <CheckCircle2 size={14} />}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold dark:text-white leading-tight">{notif.title}</p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{notif.message}</p>
                                    <p className="text-[9px] text-gray-400 mt-2">
                                      {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center">
                              <Bell className="mx-auto text-gray-300 mb-2 opacity-20" size={32} />
                              <p className="text-xs text-gray-500">No notifications yet</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative flex items-center space-x-2">
                  <Link to="/dashboard" className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300">
                      {userData?.displayName?.[0] || <User size={18} />}
                    </div>
                    <span className="font-medium text-sm hidden lg:block">{userData?.displayName || 'User'}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary-600 font-medium text-sm transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
                >
                  Join Us
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-red-600 dark:text-red-400 px-3 py-2 rounded-md text-base font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="pt-4 pb-2 border-t border-gray-200 dark:border-gray-800 flex flex-col space-y-2 px-3">
                <Link
                  to="/login"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary-600 font-medium text-base"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg text-center font-medium text-base"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
