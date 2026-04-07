export interface User {
  id: string;
  nome_completo: string;
  email: string;
  cpf?: string;
  telefone?: string;
  data_nascimento?: string;
}

export interface BikePhotos {
  frente?: string;
  tras?: string;
  lateral_direita?: string;
  lateral_esquerda?: string;
  numero_quadro?: string;
}

export interface Bike {
  id: string;
  proprietario_id: string;
  marca: string;
  modelo: string;
  cor: string;
  numero_serie: string;
  fotos: BikePhotos;
  tipo: string;
  caracteristicas?: string;
  status: 'Ativa' | 'Furtada' | 'Recuperada';
  link_rastreamento?: string;
  nota_fiscal?: string;
  data_furto?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}