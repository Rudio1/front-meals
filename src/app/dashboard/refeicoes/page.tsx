'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { MealItem, MealFormData, MealType, Unit } from '@/types/meals';

export default function NovaRefeicaoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [formData, setFormData] = useState<MealFormData>({
    user_id: user?.id || 1,
    type_id: 3, 
    description: '',
    date_time: new Date().toISOString().slice(0, 16), 
    items: [{ item_name: '', quantity: 0, unit_id: 1 }]
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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

  useEffect(() => {
    if (user?.id) {
      setFormData(prev => ({ ...prev, user_id: user.id }));
    }
  }, [user]);

  const handleInputChange = (field: keyof MealFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof MealItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_name: '', quantity: 0, unit_id: 1 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      setError('Descrição da refeição é obrigatória');
      return;
    }

    if (formData.items.some(item => !item.item_name.trim() || item.quantity <= 0)) {
      setError('Todos os itens devem ter nome e quantidade válida');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar refeição');
      }

      setSuccess('Refeição criada com sucesso!');
      
      setTimeout(() => {
        setFormData({
          user_id: user?.id || 1,
          type_id: 3,
          description: '',
          date_time: new Date().toISOString().slice(0, 16),
          items: [{ item_name: '', quantity: 0, unit_id: 1 }]
        });
        setSuccess(null);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header onToggleSidebar={toggleSidebar} />

        {/* Main Content */}
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Nova Refeição</h2>
                  <p className="text-muted-foreground">
                    Registre uma nova refeição com descrição e itens
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
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                    </div>
                  </div>
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
                  disabled={isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando...
                    </div>
                  ) : (
                    'Criar Refeição'
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
