'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { DashboardData, Refeicao, UsuarioRefeicoes } from '@/types/dashboard';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const organizarPorUsuario = (): UsuarioRefeicoes[] => {
    if (!dashboardData) return [];
    
    const usuariosMap = new Map<string, Refeicao[]>();
    
    dashboardData.data.forEach(refeicao => {
      if (!usuariosMap.has(refeicao.Usuario)) {
        usuariosMap.set(refeicao.Usuario, []);
      }
      usuariosMap.get(refeicao.Usuario)!.push(refeicao);
    });
    
    return Array.from(usuariosMap.entries()).map(([nome, refeicoes]) => ({
      nome,
      refeicoes,
      total: refeicoes.length
    }));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '', active: true },
    { id: 'refeicoes', label: 'Registrar novas refeições', icon: '', active: false },
    { id: 'configuracoes', label: 'Configurações', icon: '', active: false },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex justify-between h-14 sm:h-16">
              <div className="flex items-center flex-1 min-w-0">
                <h1 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
                  Sistema de Gestão de Refeições
                </h1>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4 ml-2">
                <span className="hidden sm:block text-sm text-gray-700">
                  Olá, <span className="font-bold">{user?.name}</span>!
                </span>
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
                         {/* Header do Dashboard */}
             <div className="mb-8">
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                 <div>
                   <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
                   <p className="text-gray-600">Refeições registradas <span className="font-bold">hoje</span></p>
                 </div>
                 <div className="mt-4 sm:mt-0">
                   <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2">
                     <p className="text-sm font-medium text-indigo-800">
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
             </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Erro ao carregar dados</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
                <button
                  onClick={fetchDashboardData}
                  className="mt-3 text-sm text-red-800 hover:text-red-900 underline"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Dashboard Content */}
            {!isLoading && !error && dashboardData && (
              <div className="space-y-6">
                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                     <div className="bg-white rounded-lg shadow p-6">
                     <div className="flex items-center">
                       <div className="flex-shrink-0">
                         <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                           <span className="text-white text-lg">🍽️</span>
                         </div>
                       </div>
                       <div className="ml-4">
                         <p className="text-sm font-medium text-gray-500">Refeições de Hoje</p>
                         <p className="text-2xl font-bold text-gray-900">{dashboardData.total_refeicoes}</p>
                       </div>
                     </div>
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
                  {organizarPorUsuario().map((usuario) => (
                    <div key={usuario.nome} className="bg-white rounded-lg shadow">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">{usuario.nome}</h3>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                            {usuario.total} refei{usuario.total !== 1 ? 'ções' : 'ção'}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Refeição
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Data
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {usuario.refeicoes.map((refeicao, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {refeicao.Refeicao}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    refeicao.Tipo === 'breakfast' ? 'bg-yellow-100 text-yellow-800' :
                                    refeicao.Tipo === 'lunch' ? 'bg-green-100 text-green-800' :
                                    refeicao.Tipo === 'dinner' ? 'bg-blue-100 text-blue-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {refeicao.Tipo === 'breakfast' ? '☀️ Café da manhã' :
                                     refeicao.Tipo === 'lunch' ? '🌞 Almoço' :
                                     refeicao.Tipo === 'dinner' ? '🌙 Jantar' :
                                     '🍿 Lanche'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {refeicao.Data}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Sidebar Menu */}
          <nav className="mt-4">
            <div className="px-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                    item.active
                      ? 'bg-indigo-100 text-indigo-700 border-l-4 border-indigo-500'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Logout Button */}
            <div className="px-4 mt-8">
              <button
                onClick={logout}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
              >
                <span className="text-xl mr-3"></span>
                <span className="font-medium">Sair</span>
              </button>
            </div>
          </nav>

          {/* User Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
