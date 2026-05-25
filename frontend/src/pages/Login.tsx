import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bike, Mail, Lock, User, Phone, ChevronRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, register, clearError, error: authError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    clearError();

    if (isRegister) {
      // Validate register
      if (!form.name.trim()) { setError('Digite seu nome completo'); return; }
      if (!form.email.trim() || !form.email.includes('@')) { setError('Digite um e-mail válido'); return; }
      if (!form.phone.trim()) { setError('Digite seu telefone'); return; }
      if (!form.password || form.password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return; }

      setLoading(true);
      const success = await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        cpf: '',
        rg: '',
        nascimento: '',
        endereco: '',
        contatoEmergencia: '',
        password: form.password
      });
      setLoading(false);

      if (success) {
        navigate('/');
      } else {
        setError(authError || 'Este e-mail já está cadastrado');
      }
    } else {
      // Validate login
      if (!form.email.trim()) { setError('Digite seu e-mail ou telefone'); return; }
      if (!form.password) { setError('Digite sua senha'); return; }

      setLoading(true);
      const success = await login(form.email, form.password);
      setLoading(false);

      if (success) {
        navigate('/');
      } else {
        setError(authError || 'E-mail ou senha incorretos');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url(/bg-pattern.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        <div className="absolute top-20 -left-20 w-60 h-60 bg-amber-500/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-40 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full px-5 pt-10 pb-8">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-xl shadow-amber-500/20 mb-4">
            <Bike className="w-10 h-10 text-[#0c1222]" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-gradient-gold">BIKE SEGURA BC</h1>
          <p className="text-slate-400 text-sm mt-1">Proteja o que te move</p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex rounded-xl bg-white/5 p-1 mb-6"
        >
          <button
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer ${
              !isRegister
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222] shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer ${
              isRegister
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222] shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Criar Conta
          </button>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card border border-red-500/30 p-3 mb-4 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-400 text-xs">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isRegister ? 'register' : 'login'}
            initial={{ opacity: 0, x: isRegister ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRegister ? -30 : 30 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            {isRegister ? (
              /* ===== REGISTER FORM ===== */
              <div className="space-y-4">
                <h2 className="text-white font-bold text-lg mb-5">Crie sua conta</h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Nome completo</label>
                    <div className="glass-card flex items-center gap-3 px-4 py-3">
                      <User className="w-5 h-5 text-amber-400 shrink-0" />
                      <input
                        type="text"
                        name="name"
                        placeholder="Seu nome"
                        value={form.name}
                        onChange={handleChange}
                        className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">E-mail</label>
                    <div className="glass-card flex items-center gap-3 px-4 py-3">
                      <Mail className="w-5 h-5 text-amber-400 shrink-0" />
                      <input
                        type="email"
                        name="email"
                        placeholder="seu@email.com"
                        value={form.email}
                        onChange={handleChange}
                        className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Telefone</label>
                    <div className="glass-card flex items-center gap-3 px-4 py-3">
                      <Phone className="w-5 h-5 text-amber-400 shrink-0" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="(47) 99999-9999"
                        value={form.phone}
                        onChange={handleChange}
                        className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Senha</label>
                    <div className="glass-card flex items-center gap-3 px-4 py-3">
                      <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        name="password"
                        placeholder="Mínimo 6 caracteres"
                        value={form.password}
                        onChange={handleChange}
                        className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-500"
                      />
                      <button onClick={() => setShowPass(!showPass)} className="cursor-pointer">
                        {showPass ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 text-center mt-4 leading-relaxed">
                  Ao criar sua conta, você concorda com nossos<br/>
                  <Link to="/termos" className="text-amber-400">Termos de Uso</Link> e <Link to="/termos" className="text-amber-400">Política de Privacidade</Link>
                </p>
              </div>
            ) : (
              /* ===== LOGIN FORM ===== */
              <div className="space-y-4">
                <h2 className="text-white font-bold text-lg mb-5">Bem-vindo de volta</h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">E-mail ou Telefone</label>
                    <div className="glass-card flex items-center gap-3 px-4 py-3">
                      <Mail className="w-5 h-5 text-amber-400 shrink-0" />
                      <input
                        type="text"
                        name="email"
                        placeholder="seu@email.com"
                        value={form.email}
                        onChange={handleChange}
                        className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Senha</label>
                    <div className="glass-card flex items-center gap-3 px-4 py-3">
                      <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        name="password"
                        placeholder="Sua senha"
                        value={form.password}
                        onChange={handleChange}
                        className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-500"
                      />
                      <button onClick={() => setShowPass(!showPass)} className="cursor-pointer">
                        {showPass ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <button className="text-amber-400 text-xs font-medium cursor-pointer hover:underline">
                    Esqueci minha senha
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-70"
            >
              <span className="text-[#0c1222] font-bold text-sm tracking-wide">
                {loading ? 'CARREGANDO...' : isRegister ? 'CRIAR CONTA' : 'ENTRAR'}
              </span>
              <ChevronRight className="w-5 h-5 text-[#0c1222]" />
            </motion.button>
          </motion.div>
        </AnimatePresence>

        {/* Demo credentials hint */}
        <div className="mt-6 text-center">
          <p className="text-slate-600 text-[10px]">
            Demo: gian@email.com / 123456
          </p>
        </div>
      </div>
    </div>
  );
}
