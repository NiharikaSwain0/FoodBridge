import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  User, 
  Mail, 
  Shield, 
  MapPin, 
  Phone, 
  Camera, 
  Save, 
  Loader2,
  Heart,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const { userData, updateUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userData?.displayName || '',
    phoneNumber: userData?.phoneNumber || '',
    address: userData?.address || '',
    organization: userData?.organization || '',
    role: userData?.role || 'donor'
  });

  const roles = [
    { id: 'donor', label: 'Donor', icon: Heart },
    { id: 'ngo', label: 'NGO / Receiver', icon: ShieldCheck },
    { id: 'volunteer', label: 'Volunteer', icon: Truck },
    { id: 'admin', label: 'Administrator', icon: Shield },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserData(formData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <User className="mr-2 text-primary-600" /> Account Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your personal information and preferences.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border dark:border-gray-800 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-3xl font-bold border-4 border-white dark:border-gray-800 shadow-md">
                  {userData?.displayName?.[0] || 'U'}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all">
                  <Camera size={16} />
                </button>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{userData?.displayName || 'User'}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{userData?.email}</p>
              <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 text-xs font-bold uppercase tracking-wider">
                {userData?.role || 'Donor'}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border dark:border-gray-800">
              <h3 className="font-bold dark:text-white mb-4">Role Information</h3>
              <div className="space-y-4">
                {roles.map((role) => (
                  <div 
                    key={role.id}
                    className={`flex items-center p-3 rounded-2xl border-2 transition-all ${
                      formData.role === role.id 
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-transparent bg-gray-50 dark:bg-gray-800/50 grayscale opacity-60'
                    }`}
                  >
                    <role.icon className={formData.role === role.id ? 'text-primary-600' : 'text-gray-400'} size={20} />
                    <span className={`ml-3 text-sm font-bold ${formData.role === role.id ? 'text-primary-900 dark:text-primary-100' : 'text-gray-500'}`}>
                      {role.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-4 leading-relaxed">
                Roles define your permissions within the FoodBridge ecosystem. Changing roles may affect your dashboard access.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border dark:border-gray-800 overflow-hidden">
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <User className="mr-2" size={16} /> Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all"
                      value={formData.displayName}
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <Mail className="mr-2" size={16} /> Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500 cursor-not-allowed"
                      value={userData?.email || ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <Phone className="mr-2" size={16} /> Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all"
                      placeholder="+1 234 567 890"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <Shield className="mr-2" size={16} /> Organization (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all"
                      placeholder="e.g. Save Food NGO"
                      value={formData.organization}
                      onChange={(e) => setFormData({...formData, organization: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <MapPin className="mr-2" size={16} /> Default Address
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all"
                    placeholder="Enter your full address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-8 bg-gray-50/50 dark:bg-gray-800/50 border-t dark:border-gray-800 flex justify-end">
                <button
                  disabled={loading}
                  type="submit"
                  className="flex items-center space-x-2 bg-primary-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 dark:shadow-none transform hover:scale-[1.02] disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
