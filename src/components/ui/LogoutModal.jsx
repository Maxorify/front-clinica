import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

/**
 * Modal profesional para confirmar el cierre de sesión
 * con opción de finalizar o mantener el turno activo.
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Callback para cerrar el modal
 * @param {function} onLogout - Callback para cerrar sesión sin finalizar turno
 * @param {function} onLogoutAndEndShift - Callback para cerrar sesión y finalizar turno
 * @param {boolean} hasActiveShift - Si el usuario tiene un turno activo
 */
export default function LogoutModal({ isOpen, onClose, onLogout, onLogoutAndEndShift, hasActiveShift }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogoutOnly = async () => {
    setIsLoading(true);
    await onLogout();
    setIsLoading(false);
  };

  const handleLogoutAndEnd = async () => {
    setIsLoading(true);
    await onLogoutAndEndShift();
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header con icono */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Cerrar Sesión</h3>
                  <p className="text-red-100 text-sm mt-1">¿Qué deseas hacer?</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {hasActiveShift ? (
                <>
                  <div className="mb-6">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Tienes un turno activo
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            Puedes mantenerlo abierto o finalizarlo ahora.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Opción 1: Finalizar turno y cerrar sesión */}
                    <button
                      onClick={handleLogoutAndEnd}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 p-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold">Finalizar turno y salir</p>
                        <p className="text-xs text-red-100">Se registrará tu hora de salida</p>
                      </div>
                    </button>

                    {/* Opción 2: Solo cerrar sesión */}
                    <button
                      onClick={handleLogoutOnly}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold">Solo cerrar sesión</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Mantener turno activo</p>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">
                    ¿Estás seguro de que deseas cerrar sesión?
                  </p>
                  <button
                    onClick={handleLogoutOnly}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 p-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-semibold"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                  </button>
                </>
              )}

              {/* Botón cancelar */}
              <button
                onClick={onClose}
                disabled={isLoading}
                className="w-full mt-3 p-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-xl transition-colors duration-200 font-medium disabled:opacity-50"
              >
                Cancelar
              </button>

              {isLoading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Procesando...</span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
