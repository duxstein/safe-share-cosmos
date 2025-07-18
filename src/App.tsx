
import React, { useState } from 'react';
import './App.css';
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from '@/contexts/Web3Context';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;
