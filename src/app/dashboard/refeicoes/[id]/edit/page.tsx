'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useRouter, useParams } from 'next/navigation';
import { MealItem, MealFormData, MealType, Unit } from '@/types/meals';
import { DashboardData, Refeicao } from '@/types/dashboard';

export default function EditarRefeicaoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const mealId = params.id as string;
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  
  const [formData, setFormData] = useState<MealFormData>({
    user_id: user?.id || 0,
    description: '',
    type_id: 0,
    date_time: '',
    items: [{ item_name: '', quantity: 0, unit_id: 0 }]
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Carregar tipos de refeição e unidades
  useEffect(() => {
    const fetchMealTypes = async () => {
      try {
        const response = await fetch('/api/meals/types');
        if (response.ok) {
          const data = await response.json();
          setMealTypes(data);
        }
      } catch (error) {
        console.error('Erro ao carregar tipos de refeição:', error);
      }
    };

    const fetchUnits = async () => {
      try {
        const response = await fetch('/api/meals/units');
        if (response.ok) {
          const data = await response.json();
          setUnits(data);
        }
      } catch (error) {
        console.error('Erro ao carregar unidades:', error);
      }
    };

    fetchMealTypes();
    fetchUnits();
  }, []);

  // Carregar dados da refeição
  useEffect(() => {
    const fetchMealData = async () => {
      if (!mealId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/meals/${mealId}`);
        
        if (response.ok) {
          const mealData: DashboardData = await response.json();
          
          // Processar dados da API para o formato do formulário
          const primeiroItem = mealData.data[0];
          if (primeiroItem) {
            // Mapear tipo de refeição pelo nome
            const tipoRefeicao = mealTypes.find(tipo => 
              tipo.name === primeiroItem.Tipo
            );
            
            // Converter data para formato de input (YYYY-MM-DDTHH:MM)
            const dataOriginal = primeiroItem.Data;
            let dataFormatada = '';
            if (dataOriginal) {
              try {
                // Converter de "DD/MM/YYYY HH:MM:SS" para "YYYY-MM-DDTHH:MM"
                const [dataParte, horaParte] = dataOriginal.split(' ');
                const [dia, mes, ano] = dataParte.split('/');
                const [hora, minuto] = horaParte.split(':');
                dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${hora}:${minuto}`;
              } catch (error) {
                console.error('Erro ao formatar data:', error);
                dataFormatada = '';
              }
            }
            
            // Mapear unidades pelos nomes
            const itemsComUnidades = mealData.data.map((item: Refeicao) => {
              const unidade = units.find(unit => 
                unit.name === item.Medida
              );
              return {
                item_name: item.NomeItem || '',
                quantity: item.Quantidade || 0,
                unit_id: unidade?.id || 0
              };
            });
            
            setFormData({
              user_id: user?.id || 0,
              description: primeiroItem.Refeicao || '',
              type_id: tipoRefeicao?.id || 0,
              date_time: dataFormatada,
              items: itemsComUnidades
            });
          }
        } else {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData.error || 'Erro ao carregar dados da refeição' });
        }
      } catch (error) {
        console.error('Erro ao carregar refeição:', error);
        setMessage({ type: 'error', text: 'Erro de conexão ao carregar dados da refeição' });
      } finally {
        setIsLoading(false);
      }
    };

    if (user && mealTypes.length > 0 && units.length > 0) {
      fetchMealData();
    }
  }, [mealId, user, mealTypes, units]);

  const handleInputChange = (field: keyof MealFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index: number, field: keyof MealItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_name: '', quantity: 0, unit_id: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSaving(true);
    setMessage(null);

    try {
      // Preparar payload - pode incluir apenas campos específicos
      const payload: Partial<MealFormData> = { user_id: user.id };
      if (formData.description) {
        payload.description = formData.description;
      }
      if (formData.type_id > 0) {
        payload.type_id = formData.type_id;
      }
      if (formData.date_time) {
        payload.date_time = new Date(formData.date_time).toISOString();
      }
      if (formData.items && formData.items.length > 0) {
        payload.items = formData.items;
      }

      const response = await fetch(`/api/meals/${mealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Refeição atualizada com sucesso!'
        });
        
        // Redirecionar após um breve delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        const errorData = await response.json();
        setMessage({
          type: 'error',
          text: errorData.error || 'Erro ao atualizar refeição'
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Erro de conexão. Tente novamente.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header onToggleSidebar={toggleSidebar} />
          <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header onToggleSidebar={toggleSidebar} />

        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Editar Refeição</h2>
                  <p className="text-muted-foreground">
                    Atualize os dados da sua refeição
                  </p>
                </div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors duration-200"
                >
                  ← Voltar ao Dashboard
                </button>
              </div>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">
                  Descrição da Refeição
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Descrição da Refeição */}
                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                      Descrição da Refeição *
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Ex: Panqueca de carne moída"
                      required
                    />
                  </div>

                  {/* Tipo de Refeição */}
                  <div>
                    <label htmlFor="type_id" className="block text-sm font-medium text-foreground mb-2">
                      Tipo de Refeição *
                    </label>
                    <select
                      id="type_id"
                      value={formData.type_id}
                      onChange={(e) => handleInputChange('type_id', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    >
                      <option value={0}>Selecione o tipo</option>
                      {mealTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Data e Hora */}
                  <div>
                    <label htmlFor="date_time" className="block text-sm font-medium text-foreground mb-2">
                      Data e Hora *
                    </label>
                    <input
                      type="datetime-local"
                      id="date_time"
                      value={formData.date_time}
                      onChange={(e) => handleInputChange('date_time', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Itens da Refeição */}
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    Itens da Refeição
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="w-full sm:w-auto px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200 font-medium"
                  >
                    + Adicionar Item
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg space-y-4">
                      {/* Nome do Item */}
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Nome do Item *
                        </label>
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Ex: Massa da panqueca"
                          required
                        />
                      </div>

                      {/* Quantidade e Unidade em linha no mobile */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Quantidade */}
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Quantidade *
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            min="0"
                            step="0.1"
                            required
                          />
                        </div>

                        {/* Unidade */}
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Unidade *
                          </label>
                          <select
                            value={item.unit_id}
                            onChange={(e) => handleItemChange(index, 'unit_id', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          >
                            <option value={0}>Selecione a unidade</option>
                            {units.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.abbreviation} - {unit.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Botão Remover */}
                      {formData.items.length > 1 && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors duration-200 border border-destructive/20"
                            title="Remover item"
                          >
                            ✕ Remover Item
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mensagens de Erro e Sucesso */}
              {message && (
                <div className={`p-4 rounded-md border ${message.type === 'success'
                  ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300'
                  : 'bg-destructive/10 border-destructive/20 text-destructive dark:text-destructive'
                  }`}>
                  {message.text}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </div>
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>

        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} activePage="refeicoes" />
      </div>
    </ProtectedRoute>
  );
}
