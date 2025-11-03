import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from '../ui/Sidebar';
import PageTransition from '../PageTransition';
import { getCurrentUser } from '../../utils/auth';

export default function Layout() {
  // Leer el modo oscuro desde localStorage, por defecto true
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();

  // Obtener información del usuario actual
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Guardar en localStorage cuando cambie el modo oscuro
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    // Aplicar o remover la clase 'dark' del documento
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser ? `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nombre || 'Admin')}&background=3b82f6&color=fff` : "https://ui-avatars.com/api/?name=Admin&background=3b82f6&color=fff"}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {currentUser?.nombre || 'Administrador'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {currentUser?.email || 'admin@clinica.com'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
