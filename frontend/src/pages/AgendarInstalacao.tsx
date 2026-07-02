import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle,
  Clock3,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../config/api';

const allowedTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

const statusLabel: Record<string, string> = {
  cadastro_realizado: 'Cadastro realizado',
  plano_ativo: 'Plano ativo',
  dispositivo_em_preparacao: 'Dispositivo em preparação',
  instalacao_agendada: 'Instalação agendada',
  instalado: 'Instalado',
  cancelado: 'Cancelado',
};

function errorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  try {
    const parsed = JSON.parse(error.message);
    return parsed.message || fallback;
  } catch {
    return error.message || fallback;
  }
}

function isWeekend(value: string) {
  if (!value) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return [0, 6].includes(date.getDay());
}

export default function AgendarInstalacao() {
  const { equipmentId = '' } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [installation, setInstallation] = useState<any>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [address, setAddress] = useState('');

  const loadInstallation = async () => {
    if (!token || !equipmentId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiGet(`/installations/my/${equipmentId}`, token);
      const item = data.installation;
      setInstallation(item);
      setDate(item.installation_date_input || item.min_installation_date_input || '');
      setTime(item.installation_time || data.allowed_times?.[0] || allowedTimes[0]);
      setAddress(item.installation_address || '');
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível carregar o agendamento.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstallation();
  }, [token, equipmentId]);

  const handleSchedule = async () => {
    if (!installation) return;
    if (isWeekend(date)) {
      setError('Escolha um dia útil para a instalação.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const data = await apiPost('/installations/schedule', {
        equipment_id: equipmentId,
        tracker_type: installation.tracker_type,
        installation_date: date,
        installation_time: time,
        installation_address: address,
      }, token || undefined);
      setInstallation(data.installation);
      setWhatsappMessage(data.whatsapp_message || '');
      setSuccess(data.message || 'Agendamento confirmado.');
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível confirmar o agendamento.'));
    } finally {
      setSaving(false);
    }
  };

  const openWhatsApp = () => {
    if (!whatsappMessage) return;
    window.open(`https://wa.me/5547992458380?text=${encodeURIComponent(whatsappMessage)}`, '_blank', 'noopener,noreferrer');
  };

  const minDate = installation?.min_installation_date_input || '';
  const status = installation?.installation_status || '';
  const alreadyInstalled = status === 'instalado';

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden pb-24">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
      </div>

      <div className="relative z-10 max-w-md md:max-w-2xl mx-auto px-4 pt-6 pb-8">
        <motion.header initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-5">
          <button onClick={() => navigate('/equipamentos')} className="w-10 h-10 rounded-xl glass-card flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Agendar Instalação</h1>
            <p className="text-xs text-slate-400">Prazo técnico de preparação e instalação</p>
          </div>
        </motion.header>

        {loading ? (
          <div className="glass-card p-6 text-center text-slate-400 text-sm">Carregando agendamento...</div>
        ) : error && !installation ? (
          <div className="glass-card border border-amber-400/20 p-5 text-center">
            <Wrench className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-white font-bold mb-2">Instalação ainda não disponível</p>
            <p className="text-slate-400 text-xs leading-relaxed">{error}</p>
            <Link to="/planos" className="mt-4 inline-flex rounded-xl bg-amber-400 px-4 py-3 text-[#0c1222] text-xs font-bold">
              VER PLANOS
            </Link>
          </div>
        ) : installation && (
          <div className="space-y-4">
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card border border-emerald-400/20 bg-emerald-400/5 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-300 text-sm font-bold">Proteção digital ativa</p>
                  <p className="text-slate-300 text-xs leading-relaxed mt-1">
                    Seu equipamento já está ativo no Bike Segura BC. Enquanto aguarda a instalação, você já pode utilizar o cadastro antifurto, QR Code, passaporte digital, alerta de furto e rede de apoio.
                  </p>
                </div>
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-[0.18em]">Dispositivo</p>
                  <h2 className="text-white text-lg font-bold mt-1">{installation.tracker_label}</h2>
                  <p className="text-slate-400 text-xs mt-1">{installation.equipment?.brand} {installation.equipment?.name}</p>
                </div>
                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-bold text-amber-300 uppercase">
                  {statusLabel[status] || status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <CalendarDays className="w-5 h-5 text-amber-400 mb-2" />
                  <p className="text-white text-sm font-bold">{installation.min_installation_date_br}</p>
                  <p className="text-slate-500 text-[11px] mt-1">Primeira data disponível</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <Clock3 className="w-5 h-5 text-cyan-300 mb-2" />
                  <p className="text-white text-sm font-bold">
                    {installation.tracker_type === 'gps' ? '12 dias úteis' : '5 dias úteis'}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-1">Prazo técnico mínimo</p>
                </div>
              </div>
            </motion.section>

            {!alreadyInstalled && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
                <h3 className="text-white font-bold text-sm mb-4">Escolha data, horário e local</h3>
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-slate-400 text-[11px] mb-1.5 block">Data</span>
                    <input
                      type="date"
                      min={minDate}
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#11192c] px-3 py-3 text-white text-sm outline-none focus:border-amber-400"
                    />
                    {isWeekend(date) && <p className="text-red-300 text-[10px] mt-1">Finais de semana não estão disponíveis.</p>}
                  </label>

                  <label className="block">
                    <span className="text-slate-400 text-[11px] mb-1.5 block">Horário</span>
                    <select
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#11192c] px-3 py-3 text-white text-sm outline-none focus:border-amber-400"
                    >
                      {allowedTimes.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-slate-400 text-[11px] mb-1.5 block">Endereço/local de instalação</span>
                    <div className="rounded-xl border border-white/10 bg-[#11192c] px-3 py-3 flex gap-2">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <textarea
                        rows={3}
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Ex: loja parceira, endereço residencial ou local combinado"
                        className="w-full bg-transparent text-white text-sm outline-none resize-none placeholder:text-slate-600"
                      />
                    </div>
                  </label>
                </div>

                {error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-red-300 text-xs">{error}</p>}
                {success && <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-300 text-xs">{success}</p>}

                <button
                  onClick={handleSchedule}
                  disabled={saving || !date || !time || address.trim().length < 8 || isWeekend(date)}
                  className="mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 py-4 text-[#0c1222] text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'CONFIRMANDO...' : 'CONFIRMAR AGENDAMENTO'}
                </button>
              </motion.section>
            )}

            {installation.installation_status === 'instalacao_agendada' && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card border border-amber-400/20 p-5 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                <p className="text-white text-sm font-bold">Instalação agendada</p>
                <p className="text-slate-400 text-xs mt-1">
                  {installation.installation_date_br} às {installation.installation_time}
                </p>
                <p className="text-slate-500 text-[11px] mt-2">{installation.installation_address}</p>
                {whatsappMessage && (
                  <button onClick={openWhatsApp} className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 text-white text-xs font-bold flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" /> ENVIAR CONFIRMAÇÃO NO WHATSAPP
                  </button>
                )}
              </motion.section>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
