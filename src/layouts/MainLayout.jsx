import React from 'react';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>
      <footer className="bg-gray-50 dark:bg-gray-900 py-12 border-t dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <span className="text-2xl font-bold text-primary-600">FoodBridge</span>
              <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-xs">
                Connecting those who have food with those who need it. Together we can reduce waste and end hunger.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Platform</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">How it works</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">Donate</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">Heatmap</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Support</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t dark:border-gray-800 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} FoodBridge. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
