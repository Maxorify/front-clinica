import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const API_URL = 'http://localhost:5000';

export default function AjustesSistema() {
  const queryClient = useQueryClient();
  
  // Obtener ID del usuario desde localStorage
  const getUserId = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      const userData = JSON.parse(userStr);
      return userData?.id || null;
    } catch {
      return null;
    }
  };

  const usuarioId = getUserId();

  // React Query para cargar perfil
  const { data: perfilData, isLoading: loading } = useQuery({
    queryKey: ['perfil', usuarioId],
    queryFn: async () => {
      if (!usuarioId) {
        throw new Error('No se encontró información del usuario. Por favor, inicie sesión nuevamente.');
      }
      const response = await axios.get(`${API_URL}/Perfil/obtener/${usuarioId}`);
      const perfil = response.data?.perfil || {};
      return {
        nombre: perfil.nombre || '',
        apellido_paterno: perfil.apellido_paterno || '',
        apellido_materno: perfil.apellido_materno || '',
        rut: perfil.rut || '',
        email: perfil.email || '',
        celular: perfil.celular || '',
        cel_secundario: perfil.cel_secundario || '',
        direccion: perfil.direccion || ''
      };
    },
    staleTime: 5 * 60 * 1000, // 5 min - perfil cambia raramente
    enabled: !!usuarioId,
    onError: (error) => {
      showNotification('error', error.message || 'Error al cargar el perfil del usuario.');
    }
  });

  const [perfil, setPerfil] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    rut: '',
    email: '',
    celular: '',
    cel_secundario: '',
    direccion: ''
  });
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});

  // Sincronizar perfil local con datos de React Query
  useEffect(() => {
    if (perfilData) {
      setPerfil(perfilData);
    }
  }, [perfilData]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Detectar cambios comparando perfil actual vs datos originales (perfilData)
  const hasChanges = useMemo(() => {
    if (!perfilData) return false;
    return Object.keys(perfil).some(key => perfil[key] !== perfilData[key]);
  }, [perfil, perfilData]);

  const showNotification = (type, message) => {
    setNotification({ id: Date.now(), type, message });
  };

  const handleInputChange = (field, value) => {
    setPerfil(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!perfil.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es requerido';
    }
    if (!perfil.apellido_paterno.trim()) {
      nuevosErrores.apellido_paterno = 'El apellido paterno es requerido';
    }
    if (!perfil.apellido_materno.trim()) {
      nuevosErrores.apellido_materno = 'El apellido materno es requerido';
    }
    if (!perfil.rut.trim()) {
      nuevosErrores.rut = 'El RUT es requerido';
    }
    if (!perfil.email.trim()) {
      nuevosErrores.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(perfil.email)) {
      nuevosErrores.email = 'El email no es válido';
    }
    if (!perfil.celular.trim()) {
      nuevosErrores.celular = 'El celular es requerido';
    }
    if (!perfil.direccion.trim()) {
      nuevosErrores.direccion = 'La dirección es requerida';
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardarCambios = async () => {
    if (!validarFormulario()) {
      showNotification('error', 'Por favor, complete todos los campos requeridos.');
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${API_URL}/Perfil/actualizar/${usuarioId}`, perfil);

      showNotification('success', 'Perfil actualizado correctamente.');

      // Invalidar cache de React Query para refrescar datos
      queryClient.invalidateQueries(['perfil', usuarioId]);

      // Actualizar localStorage con los nuevos datos del usuario
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        const updatedUserData = {
          ...userData,
          nombre: perfil.nombre,
          apellido_paterno: perfil.apellido_paterno,
          apellido_materno: perfil.apellido_materno,
          email: perfil.email
        };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
      }

    } catch (error) {
      console.error('Error al guardar perfil:', error);
      const mensajeError = error.response?.data?.detail || 'Error al guardar los cambios.';
      showNotification('error', mensajeError);
    } finally {
      setSaving(false);
    }
  };

  const cancelarCambios = () => {
    if (perfilData) {
      setPerfil({ ...perfilData });
    }
    setErrors({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* Notificaciones */}
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 right-6 z-50"
          >
            <div
              className={`max-w-sm rounded-xl border shadow-2xl px-4 py-3 backdrop-blur bg-white/90 dark:bg-gray-900/90 ${
                notification.type === 'success' ? 'border-emerald-500' : 'border-red-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full ${
                    notification.type === 'success'
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100'
                      : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100'
                  }`}
                >
                  {notification.type === 'success' ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
                    </svg>
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {notification.type === 'success' ? 'Acción completada' : 'Ocurrió un problema'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotification(null)}
                  className="ml-3 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2"
            >
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Mi Perfil
              </h1>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Gestiona tu información personal y preferencias
              </p>
            </motion.div>

            {/* Formulario de Perfil */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:p-8"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Información Personal
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={perfil.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border ${
                      errors.nombre ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all`}
                    placeholder="Ingrese su nombre"
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>
                  )}
                </div>

                {/* Apellido Paterno */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Apellido Paterno <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={perfil.apellido_paterno}
                    onChange={(e) => handleInputChange('apellido_paterno', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border ${
                      errors.apellido_paterno ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all`}
                    placeholder="Ingrese su apellido paterno"
                  />
                  {errors.apellido_paterno && (
                    <p className="mt-1 text-sm text-red-500">{errors.apellido_paterno}</p>
                  )}
                </div>

                {/* Apellido Materno */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Apellido Materno <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={perfil.apellido_materno}
                    onChange={(e) => handleInputChange('apellido_materno', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border ${
                      errors.apellido_materno ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all`}
                    placeholder="Ingrese su apellido materno"
                  />
                  {errors.apellido_materno && (
                    <p className="mt-1 text-sm text-red-500">{errors.apellido_materno}</p>
                  )}
                </div>

                {/* RUT */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    RUT <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={perfil.rut}
                    onChange={(e) => handleInputChange('rut', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border ${
                      errors.rut ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all`}
                    placeholder="Ej: 12345678-9"
                  />
                  {errors.rut && (
                    <p className="mt-1 text-sm text-red-500">{errors.rut}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={perfil.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all`}
                    placeholder="correo@ejemplo.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Celular */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Celular <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={perfil.celular}
                    onChange={(e) => handleInputChange('celular', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border ${
                      errors.celular ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all`}
                    placeholder="+56 9 1234 5678"
                  />
                  {errors.celular && (
                    <p className="mt-1 text-sm text-red-500">{errors.celular}</p>
                  )}
                </div>

                {/* Celular Secundario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Celular Secundario (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={perfil.cel_secundario}
                    onChange={(e) => handleInputChange('cel_secundario', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all"
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                {/* Dirección */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dirección <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={perfil.direccion}
                    onChange={(e) => handleInputChange('direccion', e.target.value)}
                    rows={3}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border ${
                      errors.direccion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all resize-none`}
                    placeholder="Ingrese su dirección completa"
                  />
                  {errors.direccion && (
                    <p className="mt-1 text-sm text-red-500">{errors.direccion}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Botones de Acción */}
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row justify-end gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={cancelarCambios}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors shadow-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: saving ? 1 : 1.02 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}
                  onClick={guardarCambios}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
