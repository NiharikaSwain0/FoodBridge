import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Heatmap from './pages/Heatmap';
import DonateFood from './pages/DonateFood';
import NearbyDonations from './pages/NearbyDonations';
import Pickups from './pages/Pickups';
import AdminDashboard from './pages/AdminDashboard';
import VolunteerTracking from './pages/VolunteerTracking';
import Profile from './pages/Profile';
import MyDonations from './pages/MyDonations';
import ReceivedDonations from './pages/ReceivedDonations';
import MyDeliveries from './pages/MyDeliveries';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tracking" 
            element={
              <ProtectedRoute>
                <VolunteerTracking />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/heatmap" 
            element={
              <ProtectedRoute>
                <Heatmap />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pickups" 
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <Pickups />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/nearby-donations" 
            element={
              <ProtectedRoute allowedRoles={['ngo']}>
                <NearbyDonations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/donate" 
            element={
              <ProtectedRoute allowedRoles={['donor']}>
                <DonateFood />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-donations" 
            element={
              <ProtectedRoute allowedRoles={['donor']}>
                <MyDonations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/received-donations" 
            element={
              <ProtectedRoute allowedRoles={['ngo']}>
                <ReceivedDonations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-deliveries" 
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <MyDeliveries />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
