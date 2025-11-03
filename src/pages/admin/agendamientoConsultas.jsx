import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getChileDayStart, getChileDayEnd, chileTimeToUTC } from '../../utils/dateUtils';

const API_URL = 'http://localhost:5000';

export default function AgendamientoConsultas() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [selectedEstado, setSelectedEstado] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [citas, setCitas] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [doctoresFiltrados, setDoctoresFiltrados] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    confirmadas: 0,
    pendientes: 0,
    en_consulta: 0,
    canceladas: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCita, setSelectedCita] = useState(null);

  // Formulario nueva cita
  const [formData, setFormData] = useState({
    especialidad_id: '',
    paciente_id: '',
    doctor_id: '',
    fecha: today,
    hora: '08:00',
    motivo_consulta: ''
  });

  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [horariosDisponiblesEditar, setHorariosDisponiblesEditar] = useState([]);

  // Formulario editar cita
  const [editFormData, setEditFormData] = useState({
    fecha: '',
    hora: '',
    motivo_consulta: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarEspecialidades();
    cargarDoctores();
    cargarPacientes();
    cargarCitas();
    cargarEstadisticas();
  }, []);

  // Cargar doctores cuando cambia la especialidad seleccionada
  useEffect(() => {
    if (formData.especialidad_id) {
      cargarDoctoresPorEspecialidad(formData.especialidad_id);
    } else {
      setDoctoresFiltrados([]);
    }
  }, [formData.especialidad_id]);

  // Cargar horarios disponibles cuando cambia el doctor o la fecha
  useEffect(() => {
    if (formData.doctor_id && formData.fecha) {
      cargarHorariosDisponibles();
    } else {
      setHorariosDisponibles([]);
    }
  }, [formData.doctor_id, formData.fecha]);

  // Recargar citas cuando cambian los filtros
  useEffect(() => {
    cargarCitas();
    cargarEstadisticas();
  }, [selectedDate, selectedDoctor, selectedEstado]);

  const cargarEspecialidades = async () => {
    try {
      const response = await axios.get(`${API_URL}/Citas/listar-especialidades`);
      setEspecialidades(response.data.especialidades || []);
    } catch (err) {
      console.error('Error al cargar especialidades:', err);
    }
  };

  const cargarDoctores = async () => {
    try {
      const response = await axios.get(`${API_URL}/Citas/listar-doctores`);
      setDoctores(response.data.doctores || []);
    } catch (err) {
      console.error('Error al cargar doctores:', err);
    }
  };

  const cargarDoctoresPorEspecialidad = async (especialidadId) => {
    try {
      const response = await axios.get(`${API_URL}/Citas/listar-doctores`, {
        params: { especialidad_id: especialidadId }
      });
      setDoctoresFiltrados(response.data.doctores || []);
      // Resetear doctor seleccionado si no está en la lista filtrada
      if (formData.doctor_id) {
        const doctorExiste = response.data.doctores.some(d => d.id === parseInt(formData.doctor_id));
        if (!doctorExiste) {
          setFormData({...formData, doctor_id: ''});
        }
      }
    } catch (err) {
      console.error('Error al cargar doctores por especialidad:', err);
      setDoctoresFiltrados([]);
    }
  };

  const cargarPacientes = async () => {
    try {
      const response = await axios.get(`${API_URL}/Pacientes/listar-pacientes`);
      setPacientes(response.data.pacientes || []);
    } catch (err) {
      console.error('Error al cargar pacientes:', err);
    }
  };

  const cargarHorariosDisponibles = async () => {
    try {
      // Calcular rango de fechas en zona horaria de Chile (UTC-3)
      const fechaInicio = getChileDayStart(formData.fecha);
      const fechaFin = getChileDayEnd(formData.fecha);

      console.log('DEBUG Frontend - Buscando horarios para:', formData.fecha);
      console.log('DEBUG Frontend - Fecha inicio UTC:', fechaInicio.toISOString());
      console.log('DEBUG Frontend - Fecha fin UTC:', fechaFin.toISOString());

      const response = await axios.get(`${API_URL}/Horarios/horarios-disponibles`, {
        params: {
          doctor_id: formData.doctor_id,
          fecha_inicio: fechaInicio.toISOString(),
          fecha_fin: fechaFin.toISOString(),
          especialidad_id: formData.especialidad_id || null
        }
      });

      setHorariosDisponibles(response.data.horarios_disponibles || []);
    } catch (err) {
      console.error('Error al cargar horarios disponibles:', err);
      setHorariosDisponibles([]);
    }
  };

  const cargarCitas = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedDate) params.fecha = selectedDate;
      if (selectedDoctor !== 'all') params.doctor_id = selectedDoctor;
      if (selectedEstado !== 'all') params.estado = selectedEstado;

      const response = await axios.get(`${API_URL}/Citas/listar-citas`, { params });
      setCitas(response.data.citas || []);
    } catch (err) {
      setError('Error al cargar las citas');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const params = {};
      if (selectedDate) params.fecha = selectedDate;

      const response = await axios.get(`${API_URL}/Citas/estadisticas`, { params });
      setEstadisticas(response.data);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  const crearCita = async () => {
    try {
      // Verificar que se haya seleccionado un horario disponible
      if (horariosDisponibles.length > 0 && !formData.hora) {
        alert('Por favor, seleccione un horario disponible');
        return;
      }

      // Construir fecha/hora de la cita usando zona horaria de Chile
      const fechaHoraUTC = chileTimeToUTC(formData.fecha, formData.hora);

      console.log('DEBUG - Creando cita para fecha Chile:', formData.fecha, formData.hora);
      console.log('DEBUG - Fecha UTC enviada al backend:', fechaHoraUTC);

      const payload = {
        cita: {
          fecha_atencion: fechaHoraUTC,
          paciente_id: parseInt(formData.paciente_id),
          doctor_id: parseInt(formData.doctor_id)
        },
        informacion: {
          motivo_consulta: formData.motivo_consulta
        },
        estado_inicial: 'Pendiente'
      };

      await axios.post(`${API_URL}/Citas/crear-cita`, payload);
      setShowModal(false);
      setFormData({
        especialidad_id: '',
        paciente_id: '',
        doctor_id: '',
        fecha: today,
        hora: '08:00',
        motivo_consulta: ''
      });
      setDoctoresFiltrados([]);
      setHorariosDisponibles([]);
      cargarCitas();
      cargarEstadisticas();
      alert('Cita creada exitosamente');
    } catch (err) {
      console.error('Error al crear cita:', err);
      alert(err.response?.data?.detail || 'Error al crear la cita');
    }
  };

  const cambiarEstado = async (citaId, nuevoEstado) => {
    try {
      await axios.put(`${API_URL}/Citas/cambiar-estado/${citaId}`, {
        estado: nuevoEstado
      });
      cargarCitas();
      cargarEstadisticas();
      alert(`Estado cambiado a ${nuevoEstado}`);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      alert(err.response?.data?.detail || 'Error al cambiar el estado');
    }
  };

  const verDetalleCita = async (citaId) => {
    try {
      const response = await axios.get(`${API_URL}/Citas/cita/${citaId}`);
      setSelectedCita(response.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error al cargar detalle:', err);
      alert('Error al cargar el detalle de la cita');
    }
  };

  const cargarHorariosDisponiblesEditar = async (doctorId, fecha) => {
    try {
      const fechaInicio = getChileDayStart(fecha);
      const fechaFin = getChileDayEnd(fecha);

      console.log('DEBUG Editar - Buscando horarios para:', fecha);

      const response = await axios.get(`${API_URL}/Horarios/horarios-disponibles`, {
        params: {
          doctor_id: doctorId,
          fecha_inicio: fechaInicio.toISOString(),
          fecha_fin: fechaFin.toISOString()
        }
      });

      setHorariosDisponiblesEditar(response.data.horarios_disponibles || []);
    } catch (err) {
      console.error('Error al cargar horarios para editar:', err);
      setHorariosDisponiblesEditar([]);
    }
  };

  const abrirEditarCita = (cita) => {
    setSelectedCita(cita);

    // Convertir la fecha UTC a hora de Chile para mostrar
    const fechaUTC = new Date(cita.fecha_atencion);
    const fechaChile = new Date(fechaUTC.getTime() - 3 * 60 * 60 * 1000);

    const fechaStr = fechaChile.toISOString().split('T')[0];
    const horaStr = fechaChile.toISOString().substring(11, 16);

    setEditFormData({
      fecha: fechaStr,
      hora: horaStr,
      motivo_consulta: ''
    });

    // Cargar horarios disponibles para la fecha actual
    cargarHorariosDisponiblesEditar(cita.doctor.id, fechaStr);

    setShowEditModal(true);
  };

  const editarCita = async () => {
    try {
      // Verificar que se haya seleccionado una fecha y hora
      if (!editFormData.fecha || !editFormData.hora) {
        alert('Por favor, seleccione una fecha y hora para la cita');
        return;
      }

      // Construir fecha/hora usando zona horaria de Chile
      const fechaHoraUTC = chileTimeToUTC(editFormData.fecha, editFormData.hora);

      console.log('DEBUG - Editando cita para fecha Chile:', editFormData.fecha, editFormData.hora);
      console.log('DEBUG - Nueva fecha UTC enviada al backend:', fechaHoraUTC);

      // Actualizar la fecha de la cita
      await axios.put(`${API_URL}/Citas/modificar-cita/${selectedCita.id}`, {
        fecha_atencion: fechaHoraUTC
      });

      // Actualizar el motivo de consulta si se proporcionó
      if (editFormData.motivo_consulta) {
        await axios.put(`${API_URL}/Citas/modificar-informacion/${selectedCita.id}`, {
          motivo_consulta: editFormData.motivo_consulta
        });
      }

      setShowEditModal(false);
      setHorariosDisponiblesEditar([]);
      cargarCitas();
      cargarEstadisticas();
      alert('Cita actualizada exitosamente');
    } catch (err) {
      console.error('Error al editar cita:', err);
      alert(err.response?.data?.detail || 'Error al editar la cita');
    }
  };

  const cancelarCita = async (citaId) => {
    if (!confirm('¿Está seguro de cancelar esta cita?')) return;

    try {
      await axios.delete(`${API_URL}/Citas/cancelar-cita/${citaId}`);
      cargarCitas();
      cargarEstadisticas();
      alert('Cita cancelada exitosamente');
    } catch (err) {
      console.error('Error al cancelar cita:', err);
      alert(err.response?.data?.detail || 'Error al cancelar la cita');
    }
  };

  const formatearFechaHora = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    return hora;
  };

  const formatearNombreCompleto = (persona) => {
    if (!persona) return 'N/A';
    return `${persona.nombre} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim();
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Confirmada':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'En Consulta':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Cancelada':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agendamiento de Consultas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gestión de citas médicas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nueva Cita
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">Todos los doctores</option>
              {doctores.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {formatearNombreCompleto(doctor)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</label>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="Confirmada">Confirmada</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Consulta">En Consulta</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.total}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Citas</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.confirmadas}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Confirmadas</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.pendientes}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Pendientes</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.canceladas}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Canceladas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Citas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando citas...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : citas.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No hay citas para mostrar</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hora</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {citas.map((cita) => (
                  <tr key={cita.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatearFechaHora(cita.fecha_atencion)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatearNombreCompleto(cita.paciente)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {cita.paciente?.telefono || 'Sin teléfono'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatearNombreCompleto(cita.doctor)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(cita.estado_actual)}`}>
                        {cita.estado_actual}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => verDetalleCita(cita.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Ver
                        </button>
                        <button 
                          onClick={() => abrirEditarCita(cita)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Editar
                        </button>
                        <select
                          value={cita.estado_actual}
                          onChange={(e) => cambiarEstado(cita.id, e.target.value)}
                          className="text-sm px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Confirmada">Confirmada</option>
                          <option value="En Consulta">En Consulta</option>
                          <option value="Completada">Completada</option>
                          <option value="Cancelada">Cancelada</option>
                        </select>
                        <button 
                          onClick={() => cancelarCita(cita.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nueva Cita */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nueva Cita</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Paciente *</label>
                  <select 
                    value={formData.paciente_id}
                    onChange={(e) => setFormData({...formData, paciente_id: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Seleccionar paciente</option>
                    {pacientes.map((paciente) => (
                      <option key={paciente.id} value={paciente.id}>
                        {formatearNombreCompleto(paciente)} - {paciente.rut}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Especialidad *</label>
                  <select 
                    value={formData.especialidad_id}
                    onChange={(e) => setFormData({...formData, especialidad_id: e.target.value, doctor_id: ''})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Seleccionar especialidad</option>
                    {especialidades.map((especialidad) => (
                      <option key={especialidad.id} value={especialidad.id}>
                        {especialidad.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Doctor * {formData.especialidad_id && doctoresFiltrados.length === 0 && (
                      <span className="text-yellow-600 text-xs ml-2">(No hay doctores disponibles para esta especialidad)</span>
                    )}
                  </label>
                  <select 
                    value={formData.doctor_id}
                    onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    required
                    disabled={!formData.especialidad_id}
                  >
                    <option value="">
                      {!formData.especialidad_id 
                        ? 'Primero seleccione una especialidad' 
                        : 'Seleccionar doctor'}
                    </option>
                    {doctoresFiltrados.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {formatearNombreCompleto(doctor)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha *</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Horario Disponible *
                  </label>
                  {horariosDisponibles.length > 0 ? (
                    <select
                      value={formData.hora}
                      onChange={(e) => setFormData({...formData, hora: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="">Seleccione un horario...</option>
                      {horariosDisponibles.map((horario) => {
                        // Convertir de UTC a hora de Chile (UTC-3)
                        const inicioUTC = new Date(horario.inicio_bloque);
                        const finUTC = new Date(horario.finalizacion_bloque);

                        // Restar 3 horas para convertir de UTC a Chile
                        const inicioChile = new Date(inicioUTC.getTime() - 3 * 60 * 60 * 1000);
                        const finChile = new Date(finUTC.getTime() - 3 * 60 * 60 * 1000);

                        // Extraer hora en formato HH:MM (en UTC para evitar conversión automática del navegador)
                        const horaInicio = inicioChile.toISOString().substring(11, 16);
                        const horaFin = finChile.toISOString().substring(11, 16);

                        return (
                          <option key={horario.id} value={horaInicio}>
                            {horaInicio} - {horaFin}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="w-full px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-300 text-sm">
                      {formData.doctor_id && formData.fecha
                        ? '⚠️ No hay horarios disponibles para este doctor en la fecha seleccionada'
                        : 'ℹ️ Seleccione un doctor y fecha para ver horarios disponibles'}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Motivo de Consulta</label>
                  <textarea
                    rows="3"
                    value={formData.motivo_consulta}
                    onChange={(e) => setFormData({...formData, motivo_consulta: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    placeholder="Describa el motivo de la consulta..."
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={crearCita}
                disabled={!formData.paciente_id || !formData.doctor_id}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Agendar Cita
              </button>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Editar Cita */}
      <AnimatePresence>
        {showEditModal && selectedCita && (
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Cita</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Paciente: {formatearNombreCompleto(selectedCita.paciente)} | Doctor: {formatearNombreCompleto(selectedCita.doctor)}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nueva Fecha *</label>
                    <input
                      type="date"
                      value={editFormData.fecha}
                      onChange={(e) => {
                        setEditFormData({...editFormData, fecha: e.target.value, hora: ''});
                        if (e.target.value && selectedCita.doctor.id) {
                          cargarHorariosDisponiblesEditar(selectedCita.doctor.id, e.target.value);
                        }
                      }}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nuevo Horario *
                    </label>
                    {horariosDisponiblesEditar.length > 0 ? (
                      <select
                        value={editFormData.hora}
                        onChange={(e) => setEditFormData({...editFormData, hora: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">Seleccione un horario...</option>
                        {horariosDisponiblesEditar.map((horario) => {
                          const inicioUTC = new Date(horario.inicio_bloque);
                          const finUTC = new Date(horario.finalizacion_bloque);

                          const inicioChile = new Date(inicioUTC.getTime() - 3 * 60 * 60 * 1000);
                          const finChile = new Date(finUTC.getTime() - 3 * 60 * 60 * 1000);

                          const horaInicio = inicioChile.toISOString().substring(11, 16);
                          const horaFin = finChile.toISOString().substring(11, 16);

                          return (
                            <option key={horario.id} value={horaInicio}>
                              {horaInicio} - {horaFin}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <div className="w-full px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-300 text-sm">
                        {editFormData.fecha
                          ? '⚠️ No hay horarios disponibles para esta fecha'
                          : 'ℹ️ Seleccione una fecha para ver horarios disponibles'}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Actualizar Motivo de Consulta (opcional)</label>
                    <textarea
                      rows="3"
                      value={editFormData.motivo_consulta}
                      onChange={(e) => setEditFormData({...editFormData, motivo_consulta: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      placeholder="Actualizar motivo de consulta..."
                    ></textarea>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    ℹ️ Solo puede seleccionar horarios disponibles del doctor. Si no ve el horario deseado, primero debe crear bloques de horario para ese día.
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setHorariosDisponiblesEditar([]);
                  }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={editarCita}
                  disabled={!editFormData.fecha || !editFormData.hora}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Detalle Cita */}
      <AnimatePresence>
        {showDetailModal && selectedCita && (
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detalle de Cita</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Información de la Cita */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Paciente</h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatearNombreCompleto(selectedCita.cita?.paciente)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      RUT: {selectedCita.cita?.paciente?.rut}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tel: {selectedCita.cita?.paciente?.telefono}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email: {selectedCita.cita?.paciente?.correo}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Doctor</h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatearNombreCompleto(selectedCita.cita?.doctor)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Fecha y Hora</h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {new Date(selectedCita.cita?.fecha_atencion).toLocaleString('es-CL')}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Estado Actual</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(selectedCita.estado_actual)}`}>
                      {selectedCita.estado_actual}
                    </span>
                  </div>
                </div>

                {/* Información Clínica */}
                {selectedCita.informacion && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información Clínica</h3>
                    <div className="space-y-4">
                      {selectedCita.informacion.motivo_consulta && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Motivo de Consulta</h4>
                          <p className="text-gray-900 dark:text-white">{selectedCita.informacion.motivo_consulta}</p>
                        </div>
                      )}
                      {selectedCita.informacion.antecedentes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Antecedentes</h4>
                          <p className="text-gray-900 dark:text-white">{selectedCita.informacion.antecedentes}</p>
                        </div>
                      )}
                      {selectedCita.informacion.dolores_sintomas && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Síntomas</h4>
                          <p className="text-gray-900 dark:text-white">{selectedCita.informacion.dolores_sintomas}</p>
                        </div>
                      )}
                      {selectedCita.informacion.evaluacion_doctor && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Evaluación del Doctor</h4>
                          <p className="text-gray-900 dark:text-white">{selectedCita.informacion.evaluacion_doctor}</p>
                        </div>
                      )}
                      {selectedCita.informacion.tratamiento && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tratamiento</h4>
                          <p className="text-gray-900 dark:text-white">{selectedCita.informacion.tratamiento}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}