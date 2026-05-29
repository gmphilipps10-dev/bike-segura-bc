import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Mail, Phone, MapPin,
  Edit3, Save, LogOut, ChevronRight, Bike, CreditCard,
  Users, HelpCircle, FileText
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { useBikes } from '../context/BikeContext';

export default function MeuPerfil() {
  const navigate = useNavigate();
  const { user, updateUser, logout, becomeAdmin } = useAuth();
  const { bikes } = useBikes();
  const [tornandoAdmin, setTornandoAdmin] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    nome: user?.name || '',
    email: user?.email || '',
    telefone: user?.phone || '',
    cpf: user?.cpf || '',
    rg: user?.rg || '',
    nascimento: user?.nascimento || '',
    endereco: user?.endereco || '',
    contatoEmergencia: user?.contatoEmergencia || ''
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateUser({
      name: form.nome,
      email: form.email,
      phone: form.telefone,
      cpf: form.cpf,
      rg: form.rg,
      nascimento: form.nascimento,
      endereco: form.endereco,
      contatoEmergencia: form.contatoEmergencia
    });
    setEditMode(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const bikeCount = bikes.length;
  const activeCount = bikes.filter(b => b.protected).length;

  const menuItems = [
    { icon: Bike, label: 'Meus Equipamentos', desc: `${bikeCount} bike${bikeCount !== 1 ? 's' : ''} cadastrada${bikeCount !== 1 ? 's' : ''} • ${activeCount} protegida${activeCount !== 1 ? 's' : ''}`, path: '/equipamentos' },
    { icon: CreditCard, label: 'Meu Plano', desc: 'Escolha seu plano de proteção', path: '/planos' },
    { icon: Users, label: 'Minhas Indicações', desc: 'Ganhe desconto indicando amigos', path: '/indicacoes' },
    { icon: FileText, label: 'Termos e Políticas', desc: 'Termos de uso e privacidade', path: '/termos' },
    { icon: HelpCircle, label: 'Ajuda e Suporte', desc: 'Perguntas frequentes e contato', path: '/ajuda' },
  ];

  const displayName = user?.name || 'Usuário';
  const initial = user?.name?.charAt(0) || 'U';

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        <div className="absolute top-20 -left-20 w-60 h-60 bg-violet-500/10 rounded-full blur-[100px] animate-float" />
      </div>

      <div className="relative z-10 max-w-md md:max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <Link to="/" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Meu Perfil</h1>
          </div>
          <button
            onClick={() => {
              if (editMode) {
                handleSave();
              } else {
                setEditMode(true);
              }
            }}
            className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer hover:bg-amber-500/10 transition-colors"
          >
            {editMode ? <Save className="w-5 h-5 text-emerald-400" /> : <Edit3 className="w-5 h-5 text-amber-400" />}
          </button>
        </motion.header>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 mb-5 flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-[#0c1222] font-bold text-2xl shadow-lg shadow-amber-500/20">
            {initial}
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg">{displayName}</h2>
            <p className="text-slate-400 text-xs">{user?.email || ''}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span className="text-slate-500 text-[11px]">{user?.endereco || 'Balneário Camboriú, SC'}</span>
            </div>
          </div>
        </motion.div>

        {/* Personal Data */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-5 mb-5"
        >
          <h3 className="text-amber-400 font-bold text-sm mb-4 tracking-wide">DADOS PESSOAIS</h3>

          <div className="space-y-3">
            {[
              { icon: User, label: 'Nome completo', field: 'nome', type: 'text' },
              { icon: Mail, label: 'E-mail', field: 'email', type: 'email' },
              { icon: Phone, label: 'Telefone', field: 'telefone', type: 'tel' },
              { icon: User, label: 'CPF', field: 'cpf', type: 'text' },
              { icon: FileText, label: 'RG', field: 'rg', type: 'text' },
              { icon: User, label: 'Data de nascimento', field: 'nascimento', type: 'text' },
              { icon: MapPin, label: 'Endereço', field: 'endereco', type: 'text' },
              { icon: Phone, label: 'Contato de emergência', field: 'contatoEmergencia', type: 'tel' },
            ].map(item => (
              <div key={item.field}>
                <label className="text-slate-500 text-[10px] mb-1 block">{item.label}</label>
                {editMode ? (
                  <input
                    type={item.type}
                    value={form[item.field as keyof typeof form]}
                    onChange={e => handleChange(item.field, e.target.value)}
                    className="w-full glass-card px-3 py-2 text-white text-sm outline-none focus:border-amber-400/50 transition-colors"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5 text-slate-600" />
                    <span className="text-white text-sm">{form[item.field as keyof typeof form] || 'Não informado'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {editMode && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222] font-bold text-sm cursor-pointer"
            >
              SALVAR ALTERAÇÕES
            </motion.button>
          )}
        </motion.section>

        {/* Menu Options */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-5"
        >
          <h3 className="text-amber-400 font-bold text-sm mb-3 tracking-wide">OPÇÕES</h3>

          <div className="space-y-2">
            {menuItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
              >
                <Link to={item.path} className="glass-card p-4 flex items-center gap-3 group cursor-pointer relative overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400/20 to-yellow-500/20 flex items-center justify-center shrink-0 group-hover:from-amber-400 group-hover:to-yellow-500 transition-all">
                    <item.icon className="w-5 h-5 text-amber-400 group-hover:text-[#0c1222] transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.label}</p>
                    <p className="text-slate-500 text-[11px] truncate">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-24"
        >
          <button
            onClick={handleLogout}
            className="w-full glass-card border border-red-500/20 p-4 flex items-center justify-center gap-2 group cursor-pointer hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm font-semibold">SAIR DA CONTA</span>
          </button>
        </motion.div>

      </div>

      <BottomNav />
    </div>
  );
}
