import { useEffect, useState } from 'react';
import { apiGet } from '../config/api';

export type PlanId = 'bronze' | 'prata' | 'ouro' | 'diamante';
export type PlanPrices = Record<PlanId, number>;

export const DEFAULT_PLAN_PRICES: PlanPrices = {
  bronze: 50,
  prata: 150,
  ouro: 300,
  diamante: 450,
};

const LEGACY_MONTHLY_PLAN_PRICES: PlanPrices = {
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

export function getAnnualPlanPrice(annualValue: number) {
  return Number((annualValue || 0).toFixed(2));
}

export function getMonthlyPlanPrice(annualValue: number) {
  return Number(((annualValue || 0) / 12).toFixed(2));
}

export function getDailyProtectionPrice(annualValue: number) {
  return Number(((annualValue || 0) / 365).toFixed(2));
}

export function formatDailyProtectionPrice(annualValue: number) {
  return `Menos de ${formatPlanPrice(getDailyProtectionPrice(annualValue))} por dia`;
}

export function usePlanPrices() {
  const [prices, setPrices] = useState<PlanPrices>(DEFAULT_PLAN_PRICES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/pagamentos/planos')
      .then(data => {
        if (data?.precosAnuais) setPrices({ ...DEFAULT_PLAN_PRICES, ...data.precosAnuais });
        else if (data?.precos && data.periodicidade === 'mensal') {
          setPrices(Object.fromEntries(
            Object.entries({ ...LEGACY_MONTHLY_PLAN_PRICES, ...data.precos }).map(([plano, valor]) => [
              plano,
              getAnnualPlanPrice(Number(valor) * 12),
            ])
          ) as PlanPrices);
        } else if (data?.precos) setPrices({ ...DEFAULT_PLAN_PRICES, ...data.precos });
      })
      .catch(() => setError('Nao foi possivel carregar os precos atualizados.'))
      .finally(() => setLoading(false));
  }, []);

  return { prices, loading, error };
}
