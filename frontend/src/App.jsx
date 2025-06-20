import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import AuctionDetail from './components/AuctionDetail';
import CreateAuction from './components/CreateAuction';
import MyAuctions from './components/MyAuctions';
import MyBids from './components/MyBids';
import './App.css';

function App() {
  return (
    <AuthProvider>
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
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

