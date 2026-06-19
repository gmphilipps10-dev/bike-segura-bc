import { useEffect, useState } from 'react';
import { apiGet } from '../config/api';

export type PlanId = 'bronze' | 'prata' | 'ouro' | 'diamante';
export type PlanPrices = Record<PlanId, number>;

export const DEFAULT_PLAN_PRICES: PlanPrices = {
  bronze: 4.17,
  prata: 12.5,
  ouro: 25,
  diamante: 37.5,
};

export function formatPlanPrice(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function getAnnualPlanPrice(monthlyValue: number) {
  return Number((monthlyValue * 12).toFixed(2));
}

export function getDailyProtectionPrice(monthlyValue: number) {
  return Number(((monthlyValue * 12) / 365).toFixed(2));
}

export function formatDailyProtectionPrice(monthlyValue: number) {
  return `${formatPlanPrice(getDailyProtectionPrice(monthlyValue))}/dia`;
}

export function usePlanPrices() {
  const [prices, setPrices] = useState<PlanPrices>(DEFAULT_PLAN_PRICES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/pagamentos/planos')
      .then(data => {
        if (data?.precos) setPrices({ ...DEFAULT_PLAN_PRICES, ...data.precos });
      })
      .catch(() => setError('Nao foi possivel carregar os precos atualizados.'))
      .finally(() => setLoading(false));
  }, []);

  return { prices, loading, error };
}
