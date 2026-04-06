export interface User {
  id: string;
  nome_completo: string;
  email: string;
  cpf?: string;
  telefone?: string;
  data_nascimento?: string;
}

export interface Bike {
  id: string;
  proprietario_id: string;
  marca: string;
  modelo: string;
  cor: string;
  numero_serie: string;
  fotos: string[];
  tipo: string;
  valor_estimado?: number;
  caracteristicas?: string;
  status: 'Ativa' | 'Furtada' | 'Recuperada';
  link_rastreamento?: string;
  data_furto?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}