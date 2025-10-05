
import './App.css';
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from '@/contexts/Web3Context';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Web3Provider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
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
