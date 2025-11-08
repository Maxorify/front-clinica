import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export default function Asistencia() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [asistencias, setAsistencias] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [turnosActivos, setTurnosActivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    usuario_id: '',
    solo_activos: false
  });

  const [formData, setFormData] = useState({
    usuario_sistema_id: '',
    inicio_turno: '',
    finalizacion_turno: ''
  });

  useEffect(() => {
    cargarAsistencias();
    cargarEmpleados();
    cargarTurnosActivos();
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const showNotification = (type, message) => {
    setNotification({ id: Date.now(), type, message });
  };

  const cargarAsistencias = async () => {
    try {
      const params = {};
      if (filtros.fecha_inicio) params.fecha_inicio = filtros.fecha_inicio;
      if (filtros.fecha_fin) params.fecha_fin = filtros.fecha_fin;
      if (filtros.usuario_id) params.usuario_id = filtros.usuario_id;
      if (filtros.solo_activos) params.solo_activos = filtros.solo_activos;

      const response = await axios.get(`${API_URL}/Asistencia/listar-asistencias`, { params });
      setAsistencias(response.data?.asistencias || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error al cargar asistencias:', error);
        showNotification('error', 'Error al cargar asistencias');
      }
      setAsistencias([]);
    }
  };

  const cargarEmpleados = async () => {
    try {
      const response = await axios.get(`${API_URL}/Asistencia/listar-empleados`);
      setEmpleados(response.data?.empleados || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error al cargar empleados:', error);
      }
    }
  };

  const cargarTurnosActivos = async () => {
    try {
      const response = await axios.get(`${API_URL}/Asistencia/turnos-activos`);
      setTurnosActivos(response.data?.turnos_activos || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error al cargar turnos activos:', error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFiltroChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFiltros({ ...filtros, [name]: type === 'checkbox' ? checked : value });
  };

  const aplicarFiltros = () => {
    cargarAsistencias();
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha_inicio: '',
      fecha_fin: '',
      usuario_id: '',
      solo_activos: false
    });
    setTimeout(cargarAsistencias, 100);
  };

  const registrarEntrada = async (empleadoId) => {
    try {
      await axios.post(`${API_URL}/Asistencia/registrar-entrada?usuario_sistema_id=${empleadoId}`);
      showNotification('success', 'Entrada registrada correctamente');
      await cargarAsistencias();
      await cargarTurnosActivos();
    } catch (error) {
      showNotification('error', error.response?.data?.detail || 'Error al registrar entrada');
    }
  };

  const registrarSalida = async (asistenciaId) => {
    try {
      await axios.post(`${API_URL}/Asistencia/registrar-salida/${asistenciaId}`);
      showNotification('success', 'Salida registrada correctamente');
      await cargarAsistencias();
      await cargarTurnosActivos();
    } catch (error) {
      showNotification('error', error.response?.data?.detail || 'Error al registrar salida');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = {
        usuario_sistema_id: parseInt(formData.usuario_sistema_id),
        inicio_turno: formData.inicio_turno,
        finalizacion_turno: formData.finalizacion_turno || null
      };

      if (editingId) {
        const updateData = {};
        if (formData.inicio_turno) updateData.inicio_turno = formData.inicio_turno;
        if (formData.finalizacion_turno) updateData.finalizacion_turno = formData.finalizacion_turno;

        await axios.put(`${API_URL}/Asistencia/modificar-asistencia/${editingId}`, updateData);
        showNotification('success', 'Asistencia actualizada correctamente');
      } else {
        await axios.post(`${API_URL}/Asistencia/registrar-asistencia`, dataToSend);
        showNotification('success', 'Asistencia registrada correctamente');
      }

      await cargarAsistencias();
      await cargarTurnosActivos();
      cerrarModal();
    } catch (error) {
      console.error('Error:', error);
      showNotification('error', error.response?.data?.detail || 'Error al procesar la asistencia');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (asistencia) => {
    setEditingId(asistencia.id);
    setFormData({
      usuario_sistema_id: asistencia.usuario_sistema_id,
      inicio_turno: asistencia.inicio_turno ? asistencia.inicio_turno.slice(0, 16) : '',
      finalizacion_turno: asistencia.finalizacion_turno ? asistencia.finalizacion_turno.slice(0, 16) : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro de asistencia?')) return;

    try {
      await axios.delete(`${API_URL}/Asistencia/eliminar-asistencia/${id}`);
      showNotification('success', 'Registro eliminado correctamente');
      await cargarAsistencias();
      await cargarTurnosActivos();
    } catch (error) {
      showNotification('error', error.response?.data?.detail || 'Error al eliminar');
    }
  };

  const abrirModal = () => {
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      usuario_sistema_id: '',
      inicio_turno: '',
      finalizacion_turno: ''
    });
  };

  const getEmpleadoNombre = (empleadoData) => {
    if (!empleadoData) return 'N/A';
    return `${empleadoData.nombre} ${empleadoData.apellido_paterno} ${empleadoData.apellido_materno}`;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularHorasTrabajadas = (inicio, fin) => {
    if (!inicio || !fin) return '-';
    const inicioDate = new Date(inicio);
    const finDate = new Date(fin);
    const diff = (finDate - inicioDate) / 1000 / 60 / 60; // horas
    return `${diff.toFixed(2)} hrs`;
  };

  const asistenciasFiltradas = asistencias.filter(asistencia => {
    const empleadoData = asistencia.usuario_sistema;
    const nombreCompleto = getEmpleadoNombre(empleadoData).toLowerCase();
    const rut = empleadoData?.rut?.toLowerCase() || '';
    return nombreCompleto.includes(searchTerm.toLowerCase()) || rut.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Gestión de Asistencia</h1>
        <p className="text-gray-600 dark:text-gray-400">Registra la entrada y salida del personal</p>
      </motion.div>

      {/* Notificaciones */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Turnos Activos */}
      {turnosActivos.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6 rounded"
        >
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Turnos Activos ({turnosActivos.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {turnosActivos.map(turno => (
                  <div key={turno.id} className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{getEmpleadoNombre(turno.usuario_sistema)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Entrada: {formatDateTime(turno.inicio_turno)}</p>
                    </div>
                    <button
                      onClick={() => registrarSalida(turno.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Salida
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio</label>
            <input
              type="date"
              name="fecha_inicio"
              value={filtros.fecha_inicio}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Fin</label>
            <input
              type="date"
              name="fecha_fin"
              value={filtros.fecha_fin}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empleado</label>
            <select
              name="usuario_id"
              value={filtros.usuario_id}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              {empleados.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} {emp.apellido_paterno}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="solo_activos"
                checked={filtros.solo_activos}
                onChange={handleFiltroChange}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Solo turnos activos</span>
            </label>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={aplicarFiltros}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Aplicar
            </button>
            <button
              onClick={limpiarFiltros}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      </motion.div>

      {/* Registro rápido de entrada */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Registro Rápido de Entrada</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {empleados.map(emp => (
            <button
              key={emp.id}
              onClick={() => registrarEntrada(emp.id)}
              className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              {emp.nombre} {emp.apellido_paterno}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Barra de búsqueda y botón nuevo */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre o RUT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
        <button
          onClick={abrirModal}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <span>+</span> Registrar Asistencia Manual
        </button>
      </div>

      {/* Tabla de asistencias */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empleado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Inicio Turno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fin Turno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Horas Trabajadas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {asistenciasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No hay registros de asistencia
                  </td>
                </tr>
              ) : (
                asistenciasFiltradas.map((asistencia) => (
                  <motion.tr
                    key={asistencia.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {getEmpleadoNombre(asistencia.usuario_sistema)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {asistencia.usuario_sistema?.rut || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {asistencia.usuario_sistema?.rol?.nombre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDateTime(asistencia.inicio_turno)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDateTime(asistencia.finalizacion_turno)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {calcularHorasTrabajadas(asistencia.inicio_turno, asistencia.finalizacion_turno)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        asistencia.finalizacion_turno
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {asistencia.finalizacion_turno ? 'Completo' : 'En turno'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!asistencia.finalizacion_turno && (
                        <button
                          onClick={() => registrarSalida(asistencia.id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                        >
                          Registrar Salida
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(asistencia)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(asistencia.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Eliminar
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal de formulario */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={cerrarModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                  {editingId ? 'Editar Asistencia' : 'Registrar Asistencia Manual'}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Empleado *
                      </label>
                      <select
                        name="usuario_sistema_id"
                        value={formData.usuario_sistema_id}
                        onChange={handleInputChange}
                        required
                        disabled={editingId}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Seleccionar empleado</option>
                        {empleados.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.nombre} {emp.apellido_paterno} {emp.apellido_materno} - {emp.rut}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Inicio de Turno *
                      </label>
                      <input
                        type="datetime-local"
                        name="inicio_turno"
                        value={formData.inicio_turno}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fin de Turno (opcional)
                      </label>
                      <input
                        type="datetime-local"
                        name="finalizacion_turno"
                        value={formData.finalizacion_turno}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      type="button"
                      onClick={cerrarModal}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                    >
                      {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Registrar'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
