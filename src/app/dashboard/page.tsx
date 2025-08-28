'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { DashboardData, Refeicao, UsuarioRefeicoes } from '@/types/dashboard';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isFiltering, setIsFiltering] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/meals/dashboard');
      if (!response.ok) {
        throw new Error('vish, parece que deu erro aqui minha gata. Me chama no zap pra eu dar uma olhada');
      }

      const data: DashboardData = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilteredData = async (date: string) => {
    try {
      setIsFiltering(true);
      setError(null);

      const response = await fetch(`/api/meals/filter-by-date?date=${date}`);
      if (!response.ok) {
        throw new Error('Erro ao filtrar dados por data');
      }

      const data: DashboardData = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsFiltering(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (date) {
      fetchFilteredData(date);
    } else {
      fetchDashboardData();
    }
  };

  const resetFilter = () => {
    setSelectedDate('');
    fetchDashboardData();
  };

  const organizarPorUsuario = (): UsuarioRefeicoes[] => {
    if (!dashboardData) return [];

    // Agrupa por usuário e depois por refeição
    const usuariosMap = new Map<string, Map<string, Refeicao[]>>();

    dashboardData.data.forEach(item => {
      if (!usuariosMap.has(item.Usuario)) {
        usuariosMap.set(item.Usuario, new Map());
      }

      const refeicoesMap = usuariosMap.get(item.Usuario)!;
      const chaveRefeicao = `${item.Refeicao}-${item.Data}-${item.Tipo}`;

      if (!refeicoesMap.has(chaveRefeicao)) {
        refeicoesMap.set(chaveRefeicao, []);
      }

      refeicoesMap.get(chaveRefeicao)!.push(item);
    });

    return Array.from(usuariosMap.entries()).map(([nome, refeicoesMap]) => {
      const refeicoes = Array.from(refeicoesMap.values()).flat();
      return {
        nome,
        refeicoes,
        total: refeicoes.length
      };
    });
  };

  const calcularRefeicoesUnicas = (): number => {
    if (!dashboardData) return 0;

    const refeicoesUnicas = new Set<string>();

    dashboardData.data.forEach(item => {
      const chaveRefeicao = `${item.Refeicao}-${item.Data}-${item.Tipo}`;
      refeicoesUnicas.add(chaveRefeicao);
    });

    return refeicoesUnicas.size;
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);



  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header onToggleSidebar={toggleSidebar} />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header do Dashboard */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
                  <p className="text-muted-foreground">
                    {selectedDate
                      ? `Refeições registradas em ${selectedDate.split('-').reverse().join('/')}`
                      : `Refeições registradas`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-destructive">Erro ao carregar dados</h3>
                    <p className="text-sm text-destructive mt-1">{error}</p>
                  </div>
                </div>
                <button
                  onClick={fetchDashboardData}
                  className="mt-3 text-sm text-destructive hover:text-destructive/80 underline"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Dashboard Content */}
            {!isLoading && !error && dashboardData && (
              <div className="space-y-6">
                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <div className="bg-card rounded-lg shadow p-4 sm:p-6 border border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-primary-foreground text-lg sm:text-lg">🍽️</span>
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-sm font-medium text-muted-foreground">
                            {selectedDate ? `Refeições de ${selectedDate.split('-').reverse().join('/')}` : 'Refeições de Hoje'}
                          </p>
                          <p className="text-xl sm:text-2xl font-bold text-card-foreground">{calcularRefeicoesUnicas()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-lg shadow p-4 sm:p-6 border border-border">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 sm:w-8 sm:h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg sm:text-lg">📅</span>
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-sm font-medium text-muted-foreground">Filtrar por Data</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                        <div className="relative w-full sm:w-auto">
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="w-full sm:w-auto px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                            onClick={(e) => {
                              // No mobile, abre o calendário automaticamente
                              if (window.innerWidth < 640) {
                                e.currentTarget.showPicker?.();
                              }
                            }}
                          />
                          {/* Overlay para mobile que abre o calendário */}
                          <div
                            className="absolute inset-0 sm:hidden cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              input.showPicker?.();
                            }}
                          />
                        </div>
                        {selectedDate && (
                          <button
                            onClick={resetFilter}
                            className="w-full sm:w-auto px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors duration-200"
                            title="Limpar filtro"
                          >
                            ✕ Limpar Filtro
                          </button>
                        )}
                      </div>
                    </div>
                    {isFiltering && (
                      <div className="mt-3 flex items-center text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Filtrando...
                      </div>
                    )}
                  </div>

                  {/* <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">📅</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Hoje</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {dashboardData.data.filter(r => {
                            const hoje = new Date();
                            const dataRefeicao = new Date(r.Data);
                            return dataRefeicao.toDateString() === hoje.toDateString();
                          }).length}
                        </p>
                      </div>
                    </div>
                  </div> */}
                </div>

                {/* Tabelas por Usuário */}
                <div className="space-y-6">
                  {organizarPorUsuario().map((usuario) => {
                    // Agrupa as refeições por nome, data e tipo
                    const refeicoesAgrupadas = new Map<string, Refeicao[]>();

                    usuario.refeicoes.forEach(item => {
                      const chave = `${item.Refeicao}-${item.Data}-${item.Tipo}`;
                      if (!refeicoesAgrupadas.has(chave)) {
                        refeicoesAgrupadas.set(chave, []);
                      }
                      refeicoesAgrupadas.get(chave)!.push(item);
                    });

                    return (
                      <div key={usuario.nome} className="bg-card rounded-lg shadow border border-border">
                        <div className="px-6 py-4 border-b border-border">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-card-foreground">{usuario.nome}</h3>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                              {refeicoesAgrupadas.size} refei{refeicoesAgrupadas.size !== 1 ? 'ções' : 'ção'}
                            </span>
                          </div>
                        </div>
                        {/* Mobile View - Cards */}
                        <div className="block sm:hidden space-y-4">
                          {Array.from(refeicoesAgrupadas.entries()).map(([chave, itens], index) => {
                            const primeiroItem = itens[0];
                            return (
                              <div key={index} className="bg-card border border-border rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-card-foreground mb-2 line-clamp-2">
                                      {primeiroItem.Refeicao}
                                    </h4>
                                    <div className="flex items-center space-x-2 mb-2">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${primeiroItem.Tipo === 'Café da manhã' ? 'bg-orange-500/10 text-orange-700 dark:text-orange-300' :
                                          primeiroItem.Tipo === 'Lanche da manhã' ? 'bg-yellow-500/10 text-yellow-700 dark:text-blue-300' :
                                            primeiroItem.Tipo === 'Almoço' ? 'bg-green-500/10 text-green-700 dark:text-green-300' :
                                              primeiroItem.Tipo === 'Lanche da tarde' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300' :
                                                primeiroItem.Tipo === 'Jantar' ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' :
                                                  primeiroItem.Tipo === 'Ceia' ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300' :
                                                    primeiroItem.Tipo === 'Snack (Lanche rápido)' ? 'bg-pink-500/10 text-pink-700 dark:text-pink-300' :
                                                      'bg-gray-500/10 text-gray-700 dark:text-gray-300'
                                        }`}>
                                        {primeiroItem.Tipo === 'Café da manhã' ? '☀️ Café da manhã' :
                                          primeiroItem.Tipo === 'Lanche da manhã' ? '🌅 Lanche da manhã' :
                                            primeiroItem.Tipo === 'Almoço' ? '🌞 Almoço' :
                                              primeiroItem.Tipo === 'Lanche da tarde' ? '🌤️ Lanche da tarde' :
                                                primeiroItem.Tipo === 'Jantar' ? '🌙 Jantar' :
                                                  primeiroItem.Tipo === 'Ceia' ? '🍰 Ceia' :
                                                    primeiroItem.Tipo === 'Snack (Lanche rápido)' ? '🍿 Snack (Lanche rápido)' :
                                                      primeiroItem.Tipo}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">
                                      {primeiroItem.Data}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Itens da Refeição:
                                  </p>
                                  {itens.map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                                      <span className="text-sm font-medium text-card-foreground flex-1">
                                        {item.NomeItem}
                                      </span>
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded ml-2">
                                        {item.Quantidade} {item.Medida}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop View - Table */}
                        <div className="hidden sm:block overflow-x-auto">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Refeição
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Data
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Itens
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                              {Array.from(refeicoesAgrupadas.entries()).map(([chave, itens], index) => {
                                const primeiroItem = itens[0];
                                return (
                                  <tr key={index} className="hover:bg-accent">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-card-foreground">
                                      {primeiroItem.Refeicao}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${primeiroItem.Tipo === 'Café da manhã' ? 'bg-orange-500/10 text-orange-700 dark:text-orange-300' :
                                          primeiroItem.Tipo === 'Lanche da manhã' ? 'bg-yellow-500/10 text-yellow-700 dark:text-blue-300' :
                                            primeiroItem.Tipo === 'Almoço' ? 'bg-green-500/10 text-green-700 dark:text-green-300' :
                                              primeiroItem.Tipo === 'Lanche da tarde' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300' :
                                                primeiroItem.Tipo === 'Jantar' ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' :
                                                  primeiroItem.Tipo === 'Ceia' ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300' :
                                                    primeiroItem.Tipo === 'Snack (Lanche rápido)' ? 'bg-pink-500/10 text-pink-700 dark:text-pink-300' :
                                                      'bg-gray-500/10 text-gray-700 dark:text-gray-300'
                                        }`}>
                                        {primeiroItem.Tipo === 'Café da manhã' ? 'Café da manhã' :
                                          primeiroItem.Tipo === 'Lanche da manhã' ? 'Lanche da manhã' :
                                            primeiroItem.Tipo === 'Almoço' ? 'Almoço' :
                                              primeiroItem.Tipo === 'Lanche da tarde' ? 'Lanche da tarde' :
                                                primeiroItem.Tipo === 'Jantar' ? 'Jantar' :
                                                  primeiroItem.Tipo === 'Ceia' ? 'Ceia' :
                                                    primeiroItem.Tipo === 'Snack (Lanche rápido)' ? 'Snack (Lanche rápido)' :
                                                      primeiroItem.Tipo}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                      {primeiroItem.Data}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                      <div className="space-y-1">
                                        {itens.map((item, itemIndex) => (
                                          <div key={itemIndex} className="flex items-center space-x-2">
                                            <span className="font-medium text-card-foreground">
                                              {item.NomeItem}
                                            </span>
                                            <span className="text-xs bg-muted px-2 py-1 rounded">
                                              {item.Quantidade} {item.Medida}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Data atual na parte inferior */}
            <div className="mt-8 flex justify-center">
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2">
                <p className="text-sm font-medium text-primary">
                  📅 {new Date().toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </main>

        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} activePage="dashboard" />
      </div>
    </ProtectedRoute>
  );
}
