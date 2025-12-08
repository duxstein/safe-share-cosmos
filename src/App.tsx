import React from 'react';
import './App.css';
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from '@/contexts/Web3Context';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Web3Provider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </Web3Provider>
    </AuthProvider>
  );
}

export default App;
