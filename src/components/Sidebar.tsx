'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activePage: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

export default function Sidebar({ isOpen, onToggle, activePage }: SidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '', path: '/dashboard' },
    { id: 'refeicoes', label: 'Registrar novas refeições', icon: '', path: '/dashboard/refeicoes' },
    { id: 'configuracoes', label: 'Configurações', icon: '', path: '/dashboard/configuracoes' },
  ];

  const handleMenuClick = (path: string) => {
    router.push(path);
  };

  return (
    <>
      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-64 bg-card shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">Menu</h2>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
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
                onClick={() => handleMenuClick(item.path)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                  activePage === item.id
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
    </>
  );
}
