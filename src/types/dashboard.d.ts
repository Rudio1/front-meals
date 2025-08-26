export interface Refeicao {
  Usuario: string;
  Refeicao: string;
  Data: string;
  Tipo: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
}

export interface DashboardData {
  message: string;
  total_refeicoes: number;
  data: Refeicao[];
}

export interface UsuarioRefeicoes {
  nome: string;
  refeicoes: Refeicao[];
  total: number;
}
