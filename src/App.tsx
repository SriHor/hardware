import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { ServiceCalls } from './pages/ServiceCalls';
import { Staff } from './pages/Staff';
import { Inventory } from './pages/Inventory';
import { Telecalling } from './pages/Telecalling';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        {!session ? (
          <Login />
        ) : (
          <Layout>
            <Routes>
              <Route path="/\" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/service-calls" element={<ServiceCalls />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/telecalling" element={<Telecalling />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </Layout>
        )}
      </Router>
    </AuthProvider>
  );
}

export default App;