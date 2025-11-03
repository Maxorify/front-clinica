import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export default function AjustesSistema() {
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
  const [perfilOriginal, setPerfilOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    cargarPerfil();
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    if (perfilOriginal) {
      const changed = Object.keys(perfil).some(key => perfil[key] !== perfilOriginal[key]);
      setHasChanges(changed);
    }
  }, [perfil, perfilOriginal]);

  const showNotification = (type, message) => {
    setNotification({ id: Date.now(), type, message });
  };

  const cargarPerfil = async () => {
    setLoading(true);
    try {
      // Obtener el ID del usuario desde localStorage (guardado en el login)
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        showNotification('error', 'No se encontró información del usuario. Por favor, inicie sesión nuevamente.');
        return;
      }

      const userData = JSON.parse(userStr);
      const usuarioId = userData?.id;

      if (!usuarioId) {
        showNotification('error', 'No se encontró el ID del usuario.');
        return;
      }

      const response = await axios.get(`${API_URL}/Perfil/obtener/${usuarioId}`);
      const perfilData = response.data?.perfil || {};

      setPerfil({
        nombre: perfilData.nombre || '',
        apellido_paterno: perfilData.apellido_paterno || '',
        apellido_materno: perfilData.apellido_materno || '',
        rut: perfilData.rut || '',
        email: perfilData.email || '',
        celular: perfilData.celular || '',
        cel_secundario: perfilData.cel_secundario || '',
        direccion: perfilData.direccion || ''
      });

      setPerfilOriginal({
        nombre: perfilData.nombre || '',
        apellido_paterno: perfilData.apellido_paterno || '',
        apellido_materno: perfilData.apellido_materno || '',
        rut: perfilData.rut || '',
        email: perfilData.email || '',
        celular: perfilData.celular || '',
        cel_secundario: perfilData.cel_secundario || '',
        direccion: perfilData.direccion || ''
      });

      setHasChanges(false);
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      showNotification('error', 'Error al cargar el perfil del usuario.');
    } finally {
      setLoading(false);
    }
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
      const userStr = localStorage.getItem('user');
      const userData = JSON.parse(userStr);
      const usuarioId = userData?.id;

      await axios.put(`${API_URL}/Perfil/actualizar/${usuarioId}`, perfil);

      showNotification('success', 'Perfil actualizado correctamente.');
      setPerfilOriginal({ ...perfil });
      setHasChanges(false);

      // Actualizar localStorage con los nuevos datos del usuario
      const updatedUserData = {
        ...userData,
        nombre: perfil.nombre,
        apellido_paterno: perfil.apellido_paterno,
        apellido_materno: perfil.apellido_materno,
        email: perfil.email
      };
      localStorage.setItem('user', JSON.stringify(updatedUserData));

    } catch (error) {
      console.error('Error al guardar perfil:', error);
      const mensajeError = error.response?.data?.detail || 'Error al guardar los cambios.';
      showNotification('error', mensajeError);
    } finally {
      setSaving(false);
    }
  };

  const cancelarCambios = () => {
    setPerfil({ ...perfilOriginal });
    setHasChanges(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ajustes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Gestiona tu información personal y preferencias</p>
      </div>

      {/* Notificaciones */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`px-6 py-3 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario de Perfil */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Información Personal</h2>

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
              className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border ${
                errors.nombre ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white`}
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
              className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border ${
                errors.apellido_paterno ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white`}
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
              className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border ${
                errors.apellido_materno ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white`}
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
              className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border ${
                errors.rut ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white`}
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
              className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border ${
                errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white`}
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
              className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border ${
                errors.celular ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white`}
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
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
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
              className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border ${
                errors.direccion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white`}
              placeholder="Ingrese su dirección completa"
            />
            {errors.direccion && (
              <p className="mt-1 text-sm text-red-500">{errors.direccion}</p>
            )}
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4"
        >
          <button
            onClick={cancelarCambios}
            disabled={saving}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 shadow-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={guardarCambios}
            disabled={saving}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-lg font-semibold disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
