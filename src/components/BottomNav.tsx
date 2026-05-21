import { Home, Bike, CreditCard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { icon: Home, label: 'Início', path: '/home' },
  { icon: Bike, label: 'Bikes', path: '/equipamentos' },
  { icon: CreditCard, label: 'Planos', path: '#' },
];

export default function BottomNav() {
  const location = useLocation();
  const current = location.pathname;

  const getIndicatorLeft = () => {
    if (current === '/home' || current === '/') return 'calc(16.67% - 20px)';
    if (current === '/equipamentos') return 'calc(50% - 20px)';
    return 'calc(83.33% - 20px)';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-md">
        <div className="mx-4 mb-4 rounded-2xl glass-card border border-white/[0.1] shadow-2xl shadow-black/50 overflow-hidden">
          <div className="flex items-center justify-around py-3 relative">
            <motion.div
              layoutId="nav-indicator"
              className="absolute bottom-2 w-10 h-0.5 bg-amber-400 rounded-full"
              style={{ left: getIndicatorLeft() }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = current === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors cursor-pointer ${
                    isActive ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[9px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
