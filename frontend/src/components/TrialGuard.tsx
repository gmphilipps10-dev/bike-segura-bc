import { Navigate } from 'react-router-dom';
import { useTrial } from '../hooks/useTrial';

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
  const { status, isVisitor } = useTrial();
  const currentPath = window.location.hash.replace('#', '') || '/';

  // Se está logado, acesso total
  if (isLoggedIn) return <>{children}</>;

  // Se é rota pública, permite sem restrições
  if (isPublicPath(currentPath)) return <>{children}</>;

  // Se o trial expirou, redireciona para planos (que vai pedir login)
  if (status === 'expired') {
    return <Navigate to="/login" replace />;
  }

  // Se está no período de trial (free ou warning), permite acesso
  return <>{children}</>;
}
