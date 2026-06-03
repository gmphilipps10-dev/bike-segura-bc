import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, ArrowRight } from 'lucide-react';
import { useTrial, getTrialMessage } from '../hooks/useTrial';

interface TrialBannerProps {
  isLoggedIn: boolean;
}

export default function TrialBanner({ isLoggedIn }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { status, daysRemaining } = useTrial();
  const navigate = useNavigate();

  // Se está logado ou banner foi fechado, não mostra
  if (isLoggedIn || dismissed) return null;

  // Período livre (0-3 dias) - não mostra banner
  if (status === 'free') return null;

  // Expirado - redireciona (o TrialGuard cuida disso)
  if (status === 'expired') return null;

  // Período de aviso (3-6 dias) - mostra banner educado
  const message = getTrialMessage(daysRemaining);

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-gradient-to-r from-amber-500/90 via-yellow-500/90 to-amber-500/90 backdrop-blur-sm px-4 py-3">
      <div className="max-w-md mx-auto flex items-start gap-3">
        <Clock className="w-5 h-5 text-[#0c1222] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[#0c1222] text-xs leading-relaxed font-medium">
            {message}
          </p>
          <button
            onClick={() => navigate('/planos')}
            className="inline-flex items-center gap-1 mt-2 text-[#0c1222] text-xs font-bold hover:underline cursor-pointer"
          >
            Ver planos <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-[#0c1222]/70 hover:text-[#0c1222] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
