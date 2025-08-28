export interface Refeicao {
  Id: number;
  Usuario: string;
  Refeicao: string;
  Data: string;
  Tipo: 'Café da manhã' | 'Lanche da manhã' | 'Almoço' | 'Lanche da tarde' | 'Jantar' | 'Ceia' | 'Snack (Lanche rápido)';
  NomeItem: string;
  Quantidade: number;
  Medida: string;
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
