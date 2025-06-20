import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { CurrencyProvider } from './hooks/useCurrency';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import AuctionDetail from './components/AuctionDetail';
import CreateAuction from './components/CreateAuction';
import MyAuctions from './components/MyAuctions';
import MyBids from './components/MyBids';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auction/:id" element={<AuctionDetail />} />
                <Route path="/create-auction" element={<CreateAuction />} />
                <Route path="/my-auctions" element={<MyAuctions />} />
                <Route path="/my-bids" element={<MyBids />} />
                <Route path="/admin" element={<AdminPanel />} />
              </Routes>
            </main>
          </div>
        </Router>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;

