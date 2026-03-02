import React, { useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, RotateCcw, Box, Menu, X } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sales from './components/Sales';
import Returns from './components/Returns';
import Stock from './components/Stock';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type View = 'dashboard' | 'products' | 'sales' | 'returns' | 'stock';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Ürünler', icon: Box },
    { id: 'sales', label: 'Satış İşlemleri', icon: ShoppingCart },
    { id: 'returns', label: 'İade & Karantina', icon: RotateCcw },
    { id: 'stock', label: 'Stok & Üretim', icon: Package },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <Products />;
      case 'sales': return <Sales />;
      case 'returns': return <Returns />;
      case 'stock': return <Stock />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out transform lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center space-x-3 mb-12 px-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
              S
            </div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">So-mass <span className="text-indigo-600">Dash</span></h1>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200",
                  currentView === item.id 
                    ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Kullanıcı</p>
            <p className="text-sm font-bold text-gray-900">So-mass Yönetici</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isSidebarOpen ? "lg:ml-72" : "ml-0"
      )}>
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sistem Durumu</p>
              <p className="text-sm font-bold text-emerald-600 flex items-center justify-end">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                Çevrimiçi
              </p>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>

      {/* Mobile Overlay */}
      {!isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(true)}
        />
      )}
    </div>
  );
}
