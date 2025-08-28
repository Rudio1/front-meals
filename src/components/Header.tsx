'use client';

import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user } = useAuth();

  return (
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
              onClick={onToggleSidebar}
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
  );
}
