import MinhasIndicacoes from './pages/MinhasIndicacoes';
<Route path="/indicacoes" element={<MinhasIndicacoes />} />
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Bikes from './pages/Bikes';
import BikeDetails from './pages/BikeDetails';
import AddBike from './pages/AddBike';
import EditBike from './pages/EditBike';
import Profile from './pages/Profile';
import BottomNav from './components/BottomNav';
import Plans from './pages/Plans';
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/bikes" element={<ProtectedRoute><Bikes /></ProtectedRoute>} />
        <Route path="/bike/:id" element={<ProtectedRoute><BikeDetails /></ProtectedRoute>} />
        <Route path="/add-bike" element={<ProtectedRoute><AddBike /></ProtectedRoute>} />
        <Route path="/edit-bike/:id" element={<ProtectedRoute><EditBike /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
      </Routes>
      {user && <BottomNav />}
    </div>
  );
}
