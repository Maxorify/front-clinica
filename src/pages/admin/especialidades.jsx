import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export default function Especialidades() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: ''
  });

  // Cargar especialidades al montar el componente
  useEffect(() => {
    cargarEspecialidades();
  }, []);

  // Ocultar automáticamente la notificación después de unos segundos
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const showNotification = (type, message) => {
    setNotification({ id: Date.now(), type, message });
  };

  const cargarEspecialidades = async () => {
    try {
      const response = await axios.get(`${API_URL}/doctores/especialidades`);
      setEspecialidades(response.data.especialidades || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error al cargar especialidades:', error);
        showNotification('error', 'Error al cargar especialidades');
      }
      setEspecialidades([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Actualizar especialidad
        await axios.put(`${API_URL}/doctores/modificar-especialidad/${editingId}`, formData);
        showNotification('success', 'Especialidad actualizada correctamente');
      } else {
        // Crear nueva especialidad
        await axios.post(`${API_URL}/doctores/crear-especialidad`, formData);
        showNotification('success', 'Especialidad creada correctamente');
      }

      await cargarEspecialidades();
      cerrarModal();
    } catch (error) {
      console.error('Error al guardar especialidad:', error);
      showNotification('error', error.response?.data?.detail || 'Error al guardar especialidad');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (especialidad) => {
    setEditingId(especialidad.id);
    setFormData({
      nombre: especialidad.nombre || '',
      descripcion: especialidad.descripcion || '',
      precio: especialidad.precio || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Está seguro de eliminar la especialidad "${nombre}"?`)) return;

    try {
      await axios.delete(`${API_URL}/doctores/eliminar-especialidad/${id}`);
      showNotification('success', 'Especialidad eliminada correctamente');
      await cargarEspecialidades();
    } catch (error) {
      console.error('Error al eliminar especialidad:', error);
      showNotification('error', error.response?.data?.detail || 'Error al eliminar especialidad');
    }
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: ''
    });
  };

  const filteredEspecialidades = especialidades.filter(
    (e) =>
      e.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
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
                  aria-label="Cerrar notificación"
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

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Especialidades Médicas</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Gestión de especialidades de la clínica</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nueva Especialidad
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
            />
            <svg
              className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold opacity-90">Total Especialidades</h3>
              <p className="text-4xl font-bold mt-2">{especialidades.length}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Especialidades Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEspecialidades.map((especialidad) => (
            <motion.div
              key={especialidad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {especialidad.nombre}
                    </h3>
                    {especialidad.precio && (
                      <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-semibold">
                        ${new Intl.NumberFormat('es-CL').format(especialidad.precio)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {especialidad.descripcion || 'Sin descripción'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleEdit(especialidad)}
                  className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(especialidad.id, especialidad.nombre)}
                  className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredEspecialidades.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-gray-500 dark:text-gray-400">No se encontraron especialidades</p>
          </div>
        )}
      </div>

      {/* Modal Formulario */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingId ? 'Editar Especialidad' : 'Nueva Especialidad'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la Especialidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Cardiología, Pediatría, Neurología..."
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Precio de Consulta <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-gray-500 dark:text-gray-400 font-medium">$</span>
                    <input
                      type="number"
                      name="precio"
                      value={formData.precio}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="1"
                      placeholder="30000"
                      className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Valor en pesos chilenos (CLP)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción <span className="text-gray-400">(Opcional)</span>
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Describe brevemente esta especialidad médica..."
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none"
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
