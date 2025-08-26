'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { UserSettings } from '@/types/user';
import { useTheme } from '@/contexts/ThemeContext';

const AVAILABLE_THEMES = [
    { id: 'light', name: 'Claro', icon: '☀️' },
    { id: 'dark', name: 'Escuro', icon: '🌙' },
];

export default function ConfiguracoesPage() {
    const { user, logout, updateUser } = useAuth();
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState<UserSettings>({
        name: user?.name || '',
        themeSelected: 'light',
    });

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name,
                themeSelected: user.themeSelected || theme || 'light'
            }));
        }
    }, [user, theme]);

    const handleInputChange = (field: keyof UserSettings, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const response = await fetch('/api/users/edit', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user?.id,
                    name: formData.name,
                    themeSelected: formData.themeSelected,
                }),
            });

            if (response.ok) {
                setMessage({
                    type: 'success',
                    text: 'Configurações atualizadas com sucesso!'
                });

                setTheme(formData.themeSelected as 'light' | 'dark');

                updateUser({
                    name: formData.name,
                    themeSelected: formData.themeSelected
                });
            } else {
                const errorData = await response.json();
                setMessage({
                    type: 'error',
                    text: errorData.error || 'Erro ao atualizar configurações'
                });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Erro de conexão. Tente novamente.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '', active: false },
        { id: 'refeicoes', label: 'Registrar novas refeições', icon: '', active: false },
        { id: 'configuracoes', label: 'Configurações', icon: '', active: true },
    ];

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                {/* Header */}
                <nav className="bg-card shadow-sm border-b border-border">
                    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                        <div className="flex justify-between h-14 sm:h-16">
                            <div className="flex items-center flex-1 min-w-0">
                                <h1 className="text-sm sm:text-lg lg:text-xl font-semibold text-foreground truncate">
                                    Sistema de Gestão de Refeições
                                </h1>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-4 ml-2">
                                <span className="hidden sm:block text-sm text-muted-foreground">
                                    Olá, <span className="font-bold">{user?.name}</span>!
                                </span>
                                <button
                                    onClick={toggleSidebar}
                                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
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
                <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-foreground mb-2">Configurações</h2>
                            <p className="text-muted-foreground">Gerencie suas preferências pessoais</p>
                        </div>

                        {/* Formulário de Configurações */}
                        <div className="bg-card shadow rounded-lg border border-border">
                            <div className="px-6 py-4 border-b border-border">
                                <h3 className="text-lg font-medium text-card-foreground">Preferências Pessoais</h3>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Nome do Usuário */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                                        Nome Completo
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className="w-full px-3 py-2 border border-input bg-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                        placeholder="Digite seu nome completo"
                                        required
                                    />
                                </div>

                                {/* Seleção de Tema */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Tema do Sistema
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {AVAILABLE_THEMES.map((theme) => (
                                            <label
                                                key={theme.id}
                                                className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.themeSelected === theme.id
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border hover:border-ring'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="themeSelected"
                                                    value={theme.id}
                                                    checked={formData.themeSelected === theme.id}
                                                    onChange={(e) => handleInputChange('themeSelected', e.target.value)}
                                                    className="sr-only"
                                                />
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-2xl">{theme.icon}</span>
                                                    <span className="font-medium text-foreground">{theme.name}</span>
                                                </div>
                                                {formData.themeSelected === theme.id && (
                                                    <div className="absolute top-2 right-2">
                                                        <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                                            <svg className="w-2 h-2 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Escolha o tema visual que preferir para o sistema
                                    </p>
                                </div>

                                {/* Mensagens de Feedback */}
                                {message && (
                                    <div className={`p-4 rounded-md border ${message.type === 'success'
                                        ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300'
                                        : 'bg-destructive/10 border-destructive/20 text-destructive dark:text-destructive'
                                        }`}>
                                        {message.text}
                                    </div>
                                )}

                                {/* Botões */}
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
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>

                {/* Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
                        onClick={toggleSidebar}
                    />
                )}

                {/* Sidebar */}
                <div className={`fixed top-0 right-0 h-full w-64 bg-card shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}>
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <h2 className="text-lg font-semibold text-card-foreground">Menu</h2>
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
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
                                    onClick={() => {
                                        if (item.id === 'dashboard') {
                                            router.push('/dashboard');
                                        } else if (item.id === 'configuracoes') {
                                            router.push('/dashboard/configuracoes');
                                        }
                                    }}
                                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${item.active
                                        ? 'bg-primary/10 text-primary border-l-4 border-primary'
                                        : 'text-foreground hover:bg-accent hover:text-foreground'
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
                                className="w-full flex items-center px-4 py-3 text-left rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                            >
                                <span className="text-xl mr-3"></span>
                                <span className="font-medium">Sair</span>
                            </button>
                        </div>
                    </nav>

                    {/* User Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-muted">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-primary-foreground text-sm font-medium">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {user?.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
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
