import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Map, 
  History, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  Truck,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const { userData } = useAuth();
  const location = useLocation();
  const role = userData?.role || 'donor';

  const menuItems = {
    donor: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { name: 'Donate Food', icon: PlusCircle, path: '/donate' },
      { name: 'My Donations', icon: History, path: '/my-donations' },
      { name: 'Heatmap', icon: Map, path: '/heatmap' },
    ],
    ngo: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { name: 'Find Food', icon: Map, path: '/nearby-donations' },
      { name: 'Received', icon: ShieldCheck, path: '/received-donations' },
      { name: 'Heatmap', icon: Map, path: '/heatmap' },
    ],
    volunteer: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { name: 'Pickups', icon: Truck, path: '/pickups' },
      { name: 'My Deliveries', icon: History, path: '/my-deliveries' },
      { name: 'Heatmap', icon: Map, path: '/heatmap' },
    ],
    admin: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { name: 'Users', icon: Users, path: '/admin/users' },
      { name: 'Donations', icon: AlertTriangle, path: '/admin/donations' },
      { name: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
      { name: 'Heatmap', icon: Map, path: '/heatmap' },
    ]
  };

  const currentMenu = menuItems[role] || menuItems.donor;

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-900 shadow-lg hidden md:flex flex-col transition-colors duration-300">
      <div className="p-4 border-b dark:border-gray-800">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-xl">
            {userData?.displayName?.[0] || 'U'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate w-32">
              {userData?.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role}</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {currentMenu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-primary-600 text-white shadow-md transform scale-105' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-800 hover:text-primary-600'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t dark:border-gray-800">
        <Link
          to="/profile"
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Settings size={20} />
          <span className="font-medium">Profile Settings</span>
        </Link>
      </div>
    </div>
  );
}
