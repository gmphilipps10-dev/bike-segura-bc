import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Bikes from './pages/Bikes';
import BikeDetails from './pages/BikeDetails';
import AddBike from './pages/AddBike';
import Profile from './pages/Profile';
import MinhasIndicacoes from './pages/MinhasIndicacoes';
import BottomNav from './components/BottomNav';
import './index.css';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/bikes" element={<ProtectedRoute><Bikes /></ProtectedRoute>} />
            <Route path="/bike/:id" element={<ProtectedRoute><BikeDetails /></ProtectedRoute>} />
            <Route path="/add-bike" element={<ProtectedRoute><AddBike /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/indicacoes" element={<ProtectedRoute><MinhasIndicacoes /></ProtectedRoute>} />
          </Routes>
          <BottomNav />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
