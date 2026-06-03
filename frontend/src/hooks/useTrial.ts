const VISITOR_START_KEY = 'bike_segura_visitor_start';
const TRIAL_DAYS_FREE = 3;
const TRIAL_DAYS_WARNING = 3;
const TRIAL_DAYS_TOTAL = TRIAL_DAYS_FREE + TRIAL_DAYS_WARNING;

export type TrialStatus = 'free' | 'warning' | 'expired';

export interface TrialState {
  status: TrialStatus;
  daysElapsed: number;
  daysRemaining: number;
  isVisitor: boolean;
}

function getStartDate(): number {
  let start = localStorage.getItem(VISITOR_START_KEY);
  if (!start) {
    start = String(Date.now());
    localStorage.setItem(VISITOR_START_KEY, start);
  }
  return parseInt(start);
}

export function useTrial(): TrialState {
  const startDate = getStartDate();
  const now = Date.now();
  const msElapsed = now - startDate;
  const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);

  let status: TrialStatus;
  if (daysElapsed <= TRIAL_DAYS_FREE) {
    status = 'free';
  } else if (daysElapsed <= TRIAL_DAYS_TOTAL) {
    status = 'warning';
  } else {
    status = 'expired';
  }

  const daysRemaining = Math.max(0, Math.ceil(TRIAL_DAYS_TOTAL - daysElapsed));

  return {
    status,
    daysElapsed: Math.floor(daysElapsed),
    daysRemaining,
    isVisitor: true,
  };
}

export function resetTrial(): void {
  localStorage.removeItem(VISITOR_START_KEY);
}

export function getTrialMessage(daysRemaining: number): string {
  if (daysRemaining > 3) {
    return `Você está no período de experiência gratuita. Aproveite para conhecer todas as funcionalidades do Bike Segura BC!`;
  } else if (daysRemaining > 1) {
    return `Olá! Estamos felizes que esteja conhecendo o Bike Segura BC. Para continuar protegendo sua bike com todos os nossos recursos, escolha um plano que se encaixa no seu perfil. Você tem mais ${daysRemaining} dias de acesso completo.`;
  } else if (daysRemaining === 1) {
    return `Olá! Para continuar aproveitando o Bike Segura BC e protegendo sua bike com nossos recursos exclusivos, escolha um plano. Este é seu último dia de acesso livre — amanhã será necessário efetuar o cadastro e pagamento para navegar no app.`;
  }
  return `Para continuar usando o Bike Segura BC e proteger sua bike com nossos recursos, é necessário escolher um plano e efetuar o pagamento.`;
}
