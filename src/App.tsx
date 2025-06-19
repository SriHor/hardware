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
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
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