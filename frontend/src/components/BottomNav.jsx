import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoHome, IoBicycle, IoAdd, IoPerson } from 'react-icons/io5';

const tabs = [
  { path: '/', icon: IoHome, label: 'Home' },
  { path: '/bikes', icon: IoBicycle, label: 'Bikes' },
  { path: '/add-bike', icon: IoAdd, label: 'Cadastrar' },
  { path: '/profile', icon: IoPerson, label: 'Perfil' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
        <button key={t.path} className={`nav-item ${location.pathname === t.path ? 'active' : ''}`} onClick={() => navigate(t.path)}>
          <t.icon className="nav-icon" />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
