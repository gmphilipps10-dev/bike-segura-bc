import { Navigate } from 'react-router-dom';
import { useTrial } from '../hooks/useTrial';
import { useAuth } from '../context/AuthContext';

interface TrialGuardProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
}

// Rotas públicas que SEMPRE funcionam, mesmo sem login
const PUBLIC_PATHS = ['/login', '/qr/', '/consulta/', '/indicar/'];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(p => path.startsWith(p));
}

export default function TrialGuard({ children, isLoggedIn }: TrialGuardProps) {
  const { user } = useAuth();
  const { status, isVisitor } = useTrial(user ?? undefined);
  const currentPath = window.location.hash.replace('#', '') || '/';

  // Se tem plano ativo, acesso total (independente de trial)
  if (user?.planoAtivo) return <>{children}</>;

  // Se está logado mas sem plano ativo, verifica trial
  if (isLoggedIn) return <>{children}</>;

  // Se é rota pública, permite sem restrições
  if (isPublicPath(currentPath)) return <>{children}</>;

  // Se o trial expirou, redireciona para login
  if (status === 'expired') {
    return <Navigate to="/login" replace />;
  }

  // Se está no período de trial (free ou warning), permite acesso
  return <>{children}</>;
}
