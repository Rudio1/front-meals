'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { DashboardData, Refeicao, UsuarioRefeicoes } from '@/types/dashboard';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/meals/dashboard');
      if (!response.ok) {
        throw new Error('vish, parece que deu erro aqui minha gata. Me chama no zap pra eu dar uma olhada');
      }
      const data: DashboardData = await response.json();
      setDashboardData(data);
      if (data.data.length > 0 && !activeTab) {
        const primeiroUsuario = data.data[0].Usuario;
        setActiveTab(primeiroUsuario);
      }
    } catch {
      setError('Erro de conexão ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

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

      if (data.data.length > 0 && !activeTab) {
        const primeiroUsuario = data.data[0].Usuario;
        setActiveTab(primeiroUsuario);
      }
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

  const getUsuarioAtivo = () => {
    return organizarPorUsuario().find(u => u.nome === activeTab);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const usuarios = organizarPorUsuario();

  const refeicaoPertenceAoUsuario = (refeicao: Refeicao) => {
    return user && refeicao.Usuario === user.name;
  };

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

                {/* Botão para Nova Refeição */}
                <div className="mt-4 sm:mt-0">
                  <button
                    onClick={() => router.push('/dashboard/refeicoes')}
                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <span className="mr-2">➕</span>
                    Nova Refeição
                  </button>
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

                  {/* Filtro por Data */}
                  <div
                    className="bg-card rounded-lg shadow p-4 sm:p-6 border border-border cursor-pointer sm:cursor-default"
                    onClick={(e) => {
                      // No mobile, clicar em qualquer lugar do container abre o calendário
                      if (window.innerWidth < 640) {
                        e.preventDefault();
                        const dateInput = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                        if (dateInput) {
                          dateInput.showPicker?.();
                        }
                      }
                    }}
                  >
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
                            className="w-full sm:w-auto px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                        {selectedDate && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              resetFilter();
                            }}
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
                </div>

                {/* Sistema de Abas */}
                {usuarios.length > 0 && (
                  <div className="bg-card rounded-lg shadow border border-border">
                    {/* Abas - Desktop */}
                    <div className="hidden sm:block border-b border-border">
                      <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        {usuarios.map((usuario) => (
                          <button
                            key={usuario.nome}
                            onClick={() => setActiveTab(usuario.nome)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === usuario.nome
                              ? 'border-primary text-primary'
                              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                              }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span>{usuario.nome}</span>
                            </div>
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* Abas - Mobile */}
                    <div className="sm:hidden border-b border-border">
                      <div className="px-4 py-3">
                        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                          {usuarios.map((usuario) => (
                            <button
                              key={usuario.nome}
                              onClick={() => setActiveTab(usuario.nome)}
                              className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${activeTab === usuario.nome
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{usuario.nome}</span>
                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${activeTab === usuario.nome
                                  ? 'bg-primary-foreground/20 text-primary-foreground'
                                  : 'bg-primary/20 text-primary'
                                  }`}>
                                  {usuario.total}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Conteúdo da Aba Ativa */}
                    {activeTab && getUsuarioAtivo() && (
                      <div className="p-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-card-foreground mb-2">
                            Refeições de {activeTab}
                          </h3>
                        </div>

                        {/* Agrupa as refeições por nome, data e tipo */}
                        {(() => {
                          const usuario = getUsuarioAtivo();
                          if (!usuario) return null;

                          const refeicoesAgrupadas = new Map<string, Refeicao[]>();

                          usuario.refeicoes.forEach(item => {
                            const chave = `${item.Refeicao}-${item.Data}-${item.Tipo}`;
                            if (!refeicoesAgrupadas.has(chave)) {
                              refeicoesAgrupadas.set(chave, []);
                            }
                            refeicoesAgrupadas.get(chave)!.push(item);
                          });

                          return (
                            <div className="space-y-4">
                              {/* Mobile View - Cards */}
                              <div className="block sm:hidden space-y-4">
                                {Array.from(refeicoesAgrupadas.entries()).map(([, itens], index) => {
                                  const primeiroItem = itens[0];
                                  return (
                                    <div key={index} className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
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

                                        {/* Botão de Edição Mobile - Apenas para refeições do usuário logado */}
                                        {refeicaoPertenceAoUsuario(primeiroItem) && (
                                          <div className="flex-shrink-0 ml-3">
                                            <button
                                              onClick={() => {
                                                const refeicaoId = primeiroItem.Id;
                                                router.push(`/dashboard/refeicoes/${refeicaoId}/edit`);
                                              }}
                                              className="inline-flex items-center px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                              title="Editar refeição"
                                            >
                                              Editar
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                          Itens da Refeição:
                                        </p>
                                        {itens.map((item, itemIndex) => (
                                          <div key={itemIndex} className="flex items-center justify-between bg-background rounded-lg p-2">
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
                                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Ações
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-card divide-y divide-border">
                                    {Array.from(refeicoesAgrupadas.entries()).map(([, itens], index) => {
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
                                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {/* Botão de Edição Desktop - Apenas para refeições do usuário logado */}
                                            {refeicaoPertenceAoUsuario(primeiroItem) && (
                                              <button
                                                onClick={() => {
                                                  const refeicaoId = primeiroItem.Id;
                                                  router.push(`/dashboard/refeicoes/${refeicaoId}/edit`);
                                                }}
                                                className="inline-flex items-center px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                                title="Editar refeição"
                                              >
                                                Editar
                                              </button>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
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
