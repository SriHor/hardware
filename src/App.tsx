import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { Agreements } from './pages/Agreements';
import { ServiceCalls } from './pages/ServiceCalls';
import { Staff } from './pages/Staff';
import { Inventory } from './pages/Inventory';
import { Telecalling } from './pages/Telecalling';
import { PaymentReminders } from './pages/PaymentReminders';
import { Reports } from './pages/Reports';
import { Accounting } from './pages/Accounting';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Initialize Supabase client with proper error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly set
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables are missing. Please check your .env file.');
  throw new Error('Supabase configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

// Check if environment variables contain placeholder values
if (supabaseUrl.includes('your-project') || supabaseUrl === 'your_supabase_project_url' || 
    supabaseKey.includes('your-') || supabaseKey === 'your_supabase_anon_key') {
  console.error('Supabase environment variables contain placeholder values. Please update your .env file with actual Supabase credentials.');
  throw new Error('Please update your .env file with actual Supabase project URL and anon key.');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('VITE_SUPABASE_URL must be a valid URL. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {!user ? (
        <Login />
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/agreements" element={<Agreements />} />
            <Route path="/service-calls" element={<ServiceCalls />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/telecalling" element={<Telecalling />} />
            <Route path="/reminders" element={<PaymentReminders />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/accounting" element={<Accounting />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;