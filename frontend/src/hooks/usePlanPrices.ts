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

export function formatPlanPrice(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
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
