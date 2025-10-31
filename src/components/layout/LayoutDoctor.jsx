import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SidebarDoctor from '../ui/SidebarDoctor';

export default function LayoutDoctor() {
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <SidebarDoctor
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
                  <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>

                  <div className="flex items-center gap-3">
                    <img
                      src="https://ui-avatars.com/api/?name=Doctor&background=10b981&color=fff"
                      alt="Avatar"
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Dr. García</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Medicina General</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}