import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Shield, ShieldCheck, MapPin, QrCode,
  X, Copy, Check, ExternalLink, Share2, Download,
  Pencil, Trash2, AlertTriangle, Save, Lock, Unlock,
  Navigation, Volume2, VolumeX, Loader2, Crosshair
} from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useBikes } from '../context/BikeContext';
import { useAuth } from '../context/AuthContext';
import { apiPost } from '../config/api';

function getOperationError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;

  try {
    const response = JSON.parse(error.message);
    return response.message || response.error || fallback;
  } catch {
    return error.message || fallback;
  }
}

function QRModal({ bike, onClose }: { bike: any; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const consultaUrl = bike.hash
    ? `${window.location.origin}${window.location.pathname}#/qr/${bike.hash}`
    : `${window.location.origin}${window.location.pathname}#/qr/${bike.id}`;

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(consultaUrl)}`;

  const copyHash = () => {
    navigator.clipboard.writeText(bike.hash || bike.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(consultaUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `Bike Segura BC - ${bike.name}`, url: consultaUrl }); return; } catch {}
    }
    copyLink();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-sm glass-card border border-white/10 rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-[#0c1222]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">QR Code da Bike</h3>
              <p className="text-slate-400 text-[10px]">Consulta publica</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg glass-card flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center">
          {/* QR Code Image */}
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-lg">
            <img
              src={qrApiUrl}
              alt={`QR Code ${bike.name}`}
              className="w-[200px] h-[200px]"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          {/* Bike Info */}
          <p className="text-white font-bold text-sm mb-1">{bike.name}</p>
          <p className="text-slate-500 text-xs mb-4">{bike.brand} - {bike.type}</p>

          {/* Hash */}
          <button
            onClick={copyHash}
            className="glass-card bg-amber-500/5 border border-amber-400/20 px-4 py-2.5 rounded-xl flex items-center gap-2 mb-3 w-full justify-center cursor-pointer hover:bg-amber-500/10 transition-colors"
          >
            <span className="text-amber-400 font-mono text-xs font-bold tracking-wider">
              {(bike.hash || bike.id).toUpperCase()}
            </span>
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Link */}
          <button
            onClick={copyLink}
            className="glass-card px-4 py-2.5 rounded-xl flex items-center gap-2 mb-4 w-full justify-center cursor-pointer hover:bg-white/[0.06] transition-colors"
          >
            <span className="text-slate-400 text-[10px] truncate max-w-[200px]">{consultaUrl}</span>
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
          </button>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <button
              onClick={share}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#0c1222]" />
              <span className="text-[#0c1222] font-bold text-xs">COMPARTILHAR</span>
            </button>
            <a
              href={qrApiUrl}
              download={`qr-bike-${bike.hash || bike.id}.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-xl glass-card flex items-center justify-center gap-1.5 hover:bg-white/[0.06] transition-colors"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-bold text-xs">BAIXAR</span>
            </a>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
          <p className="text-slate-500 text-[10px] text-center leading-relaxed">
            Imprima este QR Code em adesivo casca de ovo e cole no quadro da sua bike.
            Qualquer pessoa pode escanear para verificar se o equipamento e registrado.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DeleteConfirmModal({ bike, onConfirm, onClose }: { bike: any; onConfirm: () => Promise<void>; onClose: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setDeleting(true);
    setError('');

    try {
      await onConfirm();
      onClose();
    } catch (operationError) {
      setError(getOperationError(operationError, 'Nao foi possivel excluir o equipamento. Tente novamente.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !deleting && onClose()}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-sm glass-card border border-red-500/20 rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-1">Excluir equipamento?</h3>
          <p className="text-slate-400 text-xs mb-4">
            Tem certeza que deseja excluir <strong className="text-white">{bike.name}</strong>?<br />
            Esta acao nao pode ser desfeita.
          </p>
          {error && (
            <p role="alert" className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} disabled={deleting} className="flex-1 py-3 rounded-xl glass-card text-white text-sm font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">Cancelar</button>
            <button onClick={handleConfirm} disabled={deleting} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60">
              {deleting ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EditBikeModal({ bike, onSave, onClose }: { bike: any; onSave: (id: string, data: any) => Promise<any>; onClose: () => void }) {
  const [form, setForm] = useState({
    brand: bike.brand || '',
    name: bike.name || '',
    color: bike.color || '',
    serie: bike.serie || '',
    type: bike.type || '',
    caracteristicas: bike.caracteristicas || '',
    rastreamento: bike.rastreamento || '',
    plataformaTag: bike.plataformaTag || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.brand || !form.name || !form.color || !form.serie) return;
    setSaving(true);
    setError('');

    try {
      await onSave(bike.id, {
        brand: form.brand,
        name: form.name,
        color: form.color,
        serie: form.serie,
        type: form.type,
        caracteristicas: form.caracteristicas,
        rastreamento: form.rastreamento,
        plataformaTag: form.plataformaTag,
      });
      onClose();
    } catch (operationError) {
      setError(getOperationError(operationError, 'Nao foi possivel salvar as alteracoes. Tente novamente.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-sm glass-card border border-white/10 rounded-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-[#0c1222]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Editar Equipamento</h3>
              <p className="text-slate-400 text-[10px]">{bike.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg glass-card flex items-center justify-center cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-[11px] mb-1.5 block">Marca <span className="text-amber-400">*</span></label>
              <input type="text" value={form.brand} onChange={e => handleChange('brand', e.target.value)} className="w-full glass-card px-3 py-2.5 text-white text-sm outline-none" />
            </div>
            <div>
              <label className="text-slate-400 text-[11px] mb-1.5 block">Modelo <span className="text-amber-400">*</span></label>
              <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)} className="w-full glass-card px-3 py-2.5 text-white text-sm outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-[11px] mb-1.5 block">Cor <span className="text-amber-400">*</span></label>
              <input type="text" value={form.color} onChange={e => handleChange('color', e.target.value)} className="w-full glass-card px-3 py-2.5 text-white text-sm outline-none" />
            </div>
            <div>
              <label className="text-slate-400 text-[11px] mb-1.5 block">N. Serie <span className="text-amber-400">*</span></label>
              <input type="text" value={form.serie} onChange={e => handleChange('serie', e.target.value)} className="w-full glass-card px-3 py-2.5 text-white text-sm outline-none" />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-[11px] mb-1.5 block">Categoria</label>
            <input type="text" value={form.type} onChange={e => handleChange('type', e.target.value)} className="w-full glass-card px-3 py-2.5 text-white text-sm outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-[11px] mb-1.5 block">Caracteristicas</label>
            <textarea rows={2} value={form.caracteristicas} onChange={e => handleChange('caracteristicas', e.target.value)} className="w-full glass-card px-3 py-2.5 text-white text-sm outline-none resize-none" />
          </div>
          <div>
            <label className="text-slate-400 text-[11px] mb-1.5 block">Rastreamento</label>
            <input type="text" value={form.rastreamento} onChange={e => handleChange('rastreamento', e.target.value)} className="w-full glass-card px-3 py-2.5 text-white text-sm outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-[11px] mb-1.5 block">Plataforma TAG</label>
            <input type="text" value={form.plataformaTag} onChange={e => handleChange('plataformaTag', e.target.value)} className="w-full glass-card px-3 py-2.5 text-white text-sm outline-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 shrink-0">
          {error && (
            <p role="alert" className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-xs text-red-300">
              {error}
            </p>
          )}
          <button onClick={handleSave} disabled={saving || !form.brand || !form.name || !form.color || !form.serie} className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer ${saving ? 'bg-white/5 text-slate-500' : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222]'}`}>
            <Save className="w-4 h-4" /> {saving ? 'SALVANDO...' : 'SALVAR ALTERACOES'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

type GeoPoint = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

type MovementAlertData = {
  bike: any;
  latitude: number;
  longitude: number;
  distance_meters: number;
  radius_meters: number;
  timestamp: string;
};

const radiusOptions = [
  { value: 5, label: '5m experimental' },
  { value: 10, label: '10m recomendado' },
  { value: 15, label: '15m padrão' },
  { value: 20, label: '20m' },
  { value: 30, label: '30m' },
  { value: 50, label: '50m' },
  { value: 100, label: '100m' },
];

function hasGpsTracking(bike: any) {
  const tracking = `${bike?.rastreamento || ''} ${bike?.plataformaTag || ''}`.toLowerCase();
  return tracking.includes('gps') || tracking.includes('rastreador');
}

function getCurrentGpsPosition(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Não foi possível ativar a proteção. Localização GPS indisponível.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }),
      () => reject(new Error('Não foi possível ativar a proteção. Localização GPS indisponível.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );
  });
}

function formatProtectionDate(value?: string | null) {
  if (!value) return 'Sem verificação';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ProtectionControls({
  bike,
  token,
  onRefresh,
  onMovementAlert,
}: {
  bike: any;
  token: string | null;
  onRefresh: () => Promise<void>;
  onMovementAlert: (alert: MovementAlertData) => void;
}) {
  const gpsAvailable = hasGpsTracking(bike);
  const active = Boolean(bike.protection_active || bike.protectionStatus?.active);
  const session = bike.protectionStatus;
  const [radius, setRadius] = useState<number>(session?.radius_meters || 10);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const alertShownRef = useRef(false);

  useEffect(() => {
    if (session?.radius_meters) setRadius(session.radius_meters);
    if (!session?.alert_triggered) alertShownRef.current = false;
  }, [session?.radius_meters, session?.alert_triggered]);

  useEffect(() => {
    if (!active || !token || !gpsAvailable) return;
    let stopped = false;
    let running = false;

    const checkLocation = async () => {
      if (stopped || running) return;
      running = true;
      try {
        const point = await getCurrentGpsPosition();
        const result = await apiPost('/protection/check-location', {
          equipment_id: bike.id,
          current_latitude: point.latitude,
          current_longitude: point.longitude,
          timestamp: new Date().toISOString(),
        }, token);

        if ((result.alert_triggered || result.status === 'alert_triggered') && !alertShownRef.current) {
          alertShownRef.current = true;
          onMovementAlert({
            bike,
            latitude: point.latitude,
            longitude: point.longitude,
            distance_meters: result.session?.last_distance_meters || 0,
            radius_meters: result.session?.radius_meters || radius,
            timestamp: result.session?.alert_triggered_at || new Date().toISOString(),
          });
          await onRefresh();
        }
      } catch (monitorError) {
        console.warn('[Proteção] Monitoramento pausado:', monitorError);
      } finally {
        running = false;
      }
    };

    checkLocation();
    const timer = window.setInterval(checkLocation, 5000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [active, token, gpsAvailable, bike.id, radius, onMovementAlert, onRefresh]);

  if (!gpsAvailable) {
    return (
      <div className="mt-3 rounded-xl border border-slate-700/70 bg-slate-900/50 px-3 py-3">
        <div className="flex items-start gap-2">
          <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-slate-400">
            Modo Proteção disponível apenas para equipamentos com rastreador GPS.
          </p>
        </div>
      </div>
    );
  }

  const handleActivate = async () => {
    if (!token) {
      setError('Sua sessão expirou. Entre novamente para ativar a proteção.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const point = await getCurrentGpsPosition();
      const result = await apiPost('/protection/activate', {
        equipment_id: bike.id,
        radius_meters: radius,
        initial_latitude: point.latitude,
        initial_longitude: point.longitude,
      }, token);
      setMessage(result.message || 'Proteção ativada. Seu equipamento está sendo monitorado.');
      await onRefresh();
    } catch (activateError) {
      setError(getOperationError(activateError, 'Não foi possível ativar a proteção. Localização GPS indisponível.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivate = async () => {
    if (!token) {
      setError('Sua sessão expirou. Entre novamente para desativar a proteção.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await apiPost('/protection/deactivate', { equipment_id: bike.id }, token);
      setMessage(result.message || 'Proteção desativada.');
      await onRefresh();
    } catch (deactivateError) {
      setError(getOperationError(deactivateError, 'Não foi possível desativar a proteção.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`mt-3 rounded-xl border p-3 ${active ? 'border-emerald-400/25 bg-emerald-500/10' : 'border-amber-400/20 bg-amber-500/5'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-emerald-400/15' : 'bg-amber-400/15'}`}>
            {active ? <Lock className="w-4 h-4 text-emerald-300" /> : <Crosshair className="w-4 h-4 text-amber-300" />}
          </div>
          <div>
            <p className="text-white text-xs font-bold">{active ? 'Proteção ativa' : 'Modo proteção'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {active
                ? `Raio ${session?.radius_meters || radius}m • Última verificação: ${formatProtectionDate(session?.last_checked_at)}`
                : 'Cria uma cerca temporária e alerta se houver deslocamento.'}
            </p>
            {session?.last_distance_meters != null && (
              <p className={`text-[10px] mt-1 ${session.alert_triggered ? 'text-red-300' : 'text-slate-500'}`}>
                Última distância: {Math.round(session.last_distance_meters)}m
                {session.alert_triggered ? ' • alerta disparado' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {!active && (
        <div className="mt-3">
          <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5 block">Raio da geocerca</label>
          <select
            value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            className="w-full rounded-lg border border-white/10 bg-[#0c1222] px-3 py-2 text-xs text-white outline-none"
          >
            {radiusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {radius === 5 && (
            <p className="mt-2 text-[10px] text-amber-300">
              Raio de 5m pode gerar falsos alertas devido à variação do GPS.
            </p>
          )}
        </div>
      )}

      {(message || error) && (
        <p className={`mt-3 rounded-lg px-3 py-2 text-[11px] ${error ? 'bg-red-500/10 text-red-300 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
          {error || message}
        </p>
      )}

      <button
        onClick={active ? handleDeactivate : handleActivate}
        disabled={busy}
        className={`mt-3 w-full rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
          active
            ? 'bg-white/8 text-slate-100 border border-white/10 hover:bg-white/12'
            : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222]'
        }`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : active ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        {busy ? 'PROCESSANDO...' : active ? 'Desativar Proteção' : 'Ativar Proteção'}
      </button>
    </div>
  );
}

function MovementAlertModal({
  alert,
  token,
  onClose,
}: {
  alert: MovementAlertData;
  token: string | null;
  onClose: () => void;
}) {
  const audioRef = useRef<{
    context?: AudioContext;
    oscillator?: OscillatorNode;
    gain?: GainNode;
    timer?: number;
  }>({});
  const [silenced, setSilenced] = useState(false);
  const [sendingFurto, setSendingFurto] = useState(false);

  const stopSiren = async () => {
    const audio = audioRef.current;
    if (audio.timer) window.clearInterval(audio.timer);
    try {
      audio.gain?.gain.setTargetAtTime(0.0001, audio.context?.currentTime || 0, 0.08);
      window.setTimeout(() => {
        try { audio.oscillator?.stop(); } catch {}
        try { audio.context?.close(); } catch {}
      }, 150);
    } catch {}
    audioRef.current = {};
    setSilenced(true);
    navigator.vibrate?.(0);
    if (token) {
      try { await apiPost('/protection/siren-silenced', { equipment_id: alert.bike.id }, token); } catch {}
    }
  };

  useEffect(() => {
    navigator.vibrate?.([800, 250, 800, 250, 1200]);
    try {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioCtor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = 520;
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      gain.gain.setTargetAtTime(0.28, context.currentTime, 0.1);
      let high = false;
      const timer = window.setInterval(() => {
        high = !high;
        oscillator.frequency.setTargetAtTime(high ? 980 : 520, context.currentTime, 0.05);
      }, 430);
      audioRef.current = { context, oscillator, gain, timer };
    } catch (audioError) {
      console.warn('[Proteção] Sirene bloqueada pelo navegador:', audioError);
    }

    return () => {
      const audio = audioRef.current;
      if (audio.timer) window.clearInterval(audio.timer);
      try { audio.oscillator?.stop(); } catch {}
      try { audio.context?.close(); } catch {}
      navigator.vibrate?.(0);
    };
  }, []);

  const openMaps = () => {
    window.open(`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`, '_blank', 'noopener,noreferrer');
  };

  const emitFurto = async () => {
    if (!token) return;
    setSendingFurto(true);
    try {
      await apiPost(`/bikes/${alert.bike.id}/furto`, {}, token);
      await stopSiren();
      onClose();
    } catch (error) {
      window.alert('Não foi possível emitir o alerta de furto agora. Tente novamente.');
    } finally {
      setSendingFurto(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[700] bg-red-950/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        className="w-full max-w-md rounded-3xl border border-red-400/30 bg-[#130b12] shadow-2xl shadow-red-500/30 overflow-hidden"
      >
        <div className="p-6 text-center border-b border-red-400/10">
          <div className="w-20 h-20 rounded-full bg-red-500 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-red-500/40 animate-pulse">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <p className="text-red-300 text-xs font-black tracking-[0.25em] uppercase">Movimentação detectada</p>
          <h2 className="text-white text-2xl font-black mt-2">🚨 ATENÇÃO</h2>
          <p className="text-slate-300 text-sm mt-2">
            Seu equipamento saiu da área protegida.
          </p>
        </div>

        <div className="p-5 space-y-3">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-white font-bold">{alert.bike.brand} {alert.bike.name}</p>
            <p className="text-slate-400 text-xs mt-1">Série: {alert.bike.serie}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-red-500/10 border border-red-400/20 p-3">
              <p className="text-red-200 text-[10px] uppercase">Distância</p>
              <p className="text-white text-xl font-black">{Math.round(alert.distance_meters)}m</p>
            </div>
            <div className="rounded-2xl bg-amber-500/10 border border-amber-400/20 p-3">
              <p className="text-amber-200 text-[10px] uppercase">Raio configurado</p>
              <p className="text-white text-xl font-black">{alert.radius_meters}m</p>
            </div>
          </div>
          <p className="text-slate-500 text-xs text-center">Horário: {formatProtectionDate(alert.timestamp)}</p>

          <button onClick={openMaps} className="w-full rounded-xl bg-white text-slate-950 py-3 font-bold text-sm flex items-center justify-center gap-2">
            <Navigation className="w-4 h-4" />
            Ver localização
          </button>
          <button onClick={emitFurto} disabled={sendingFurto} className="w-full rounded-xl bg-red-500 text-white py-3 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            <AlertTriangle className="w-4 h-4" />
            {sendingFurto ? 'Emitindo alerta...' : 'Emitir Alerta de Furto'}
          </button>
          <button onClick={stopSiren} className="w-full rounded-xl border border-white/10 bg-white/5 text-slate-200 py-3 font-bold text-sm flex items-center justify-center gap-2">
            {silenced ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {silenced ? 'Sirene silenciada' : 'Silenciar Sirene'}
          </button>
          <button onClick={onClose} className="w-full text-slate-500 text-xs py-2">Fechar alerta</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MeusEquipamentos() {
  const { bikes, removeBike, updateBike, refreshBikes } = useBikes();
  const { token } = useAuth();
  const [selectedBike, setSelectedBike] = useState<any>(null);
  const [bikeToDelete, setBikeToDelete] = useState<any>(null);
  const [bikeToEdit, setBikeToEdit] = useState<any>(null);
  const [movementAlert, setMovementAlert] = useState<MovementAlertData | null>(null);
  const activeCount = bikes.filter(b => b.protected).length;

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        <div className="absolute top-20 -left-20 w-60 h-60 bg-amber-500/10 rounded-full blur-[100px] animate-float" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-6 lg:px-8 xl:px-10 pt-6 pb-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <Link to="/" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer hover:bg-white/[0.06] transition-colors">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Meus Equipamentos</h1>
            <p className="text-xs text-slate-400">{bikes.length} {bikes.length === 1 ? 'bike cadastrada' : 'bikes cadastradas'} • {activeCount} protegidas</p>
          </div>
        </motion.header>

        {/* Summary Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 mb-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{activeCount} de {bikes.length} equipamentos protegidos</p>
            <p className="text-xs text-slate-400 mt-0.5">Monitoramento em tempo real ativo</p>
          </div>
          <div className="text-right">
            <p className="text-emerald-400 font-bold text-lg">{bikes.length > 0 ? Math.round((activeCount / bikes.length) * 100) : 0}%</p>
          </div>
        </motion.div>

        {/* Bike List */}
        <div className="space-y-4 mb-24">
          {bikes.map((bike, i) => (
            <motion.div
              key={bike.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="glass-card-hover overflow-hidden group"
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={bike.photo || '/bike-1.jpg'} alt={bike.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-transparent to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    bike.protected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {bike.protected ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                    {bike.protected ? 'PROTEGIDO' : 'DESATIVADO'}
                  </div>
                </div>

                {/* Bike Type */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-medium border border-white/10">
                    {bike.type}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-base mb-1">{bike.name}</h3>

                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-400 text-xs font-mono">{bike.serie}</span>
                </div>

                {/* Hash + QR Button */}
                {bike.hash && (
                  <button
                    onClick={() => setSelectedBike(bike)}
                    className="w-full glass-card bg-amber-500/5 border border-amber-400/20 px-3 py-2 rounded-xl flex items-center justify-between mb-3 cursor-pointer hover:bg-amber-500/10 transition-colors group/qr"
                  >
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-400 font-mono text-[10px] font-bold tracking-wider">{bike.hash.toUpperCase()}</span>
                    </div>
                    <span className="text-amber-400 text-[10px] font-medium flex items-center gap-1">
                      Ver QR
                      <ExternalLink className="w-3 h-3 group-hover/qr:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                )}

                <ProtectionControls
                  bike={bike}
                  token={token}
                  onRefresh={refreshBikes}
                  onMovementAlert={setMovementAlert}
                />

                {/* Actions: Edit / Delete */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setBikeToEdit(bike)}
                    className="flex-1 py-2 rounded-lg glass-card flex items-center justify-center gap-1.5 text-slate-300 text-xs hover:border-amber-400/30 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => setBikeToDelete(bike)}
                    className="flex-1 py-2 rounded-lg glass-card flex items-center justify-center gap-1.5 text-red-400 text-xs hover:border-red-500/30 hover:bg-red-500/5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-400 text-xs">{bike.location}</span>
                  </div>
                  <span className={`text-[10px] font-medium ${
                    bike.protected ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {bike.lastSeen}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add Button */}
        {bikes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-slate-400 text-sm mb-4">Nenhum equipamento cadastrado</p>
            <Link to="/cadastrar" className="text-amber-400 text-xs">Cadastrar agora</Link>
          </motion.div>
        )}

        <Link to="/cadastrar">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="fixed bottom-20 right-4 z-40"
          >
            <button className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30 cursor-pointer hover:scale-105 transition-transform">
              <Plus className="w-6 h-6 text-[#0c1222]" />
            </button>
          </motion.div>
        </Link>

      </div>

      <BottomNav />

      {/* QR Modal */}
      <AnimatePresence>
        {selectedBike && (
          <QRModal bike={selectedBike} onClose={() => setSelectedBike(null)} />
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {bikeToDelete && (
          <DeleteConfirmModal
            bike={bikeToDelete}
            onConfirm={() => removeBike(bikeToDelete.id)}
            onClose={() => setBikeToDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit Bike Modal */}
      <AnimatePresence>
        {bikeToEdit && (
          <EditBikeModal
            bike={bikeToEdit}
            onSave={updateBike}
            onClose={() => setBikeToEdit(null)}
          />
        )}
      </AnimatePresence>

      {/* Movement Alert Modal */}
      <AnimatePresence>
        {movementAlert && (
          <MovementAlertModal
            alert={movementAlert}
            token={token}
            onClose={() => setMovementAlert(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
