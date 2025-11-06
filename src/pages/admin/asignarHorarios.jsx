import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getChileDayStart, getChileDayEnd } from '../../utils/dateUtils';

const API_URL = 'http://localhost:5000';

export default function AsignarHorarios() {
  const [doctores, setDoctores] = useState([]);
  const [doctorSeleccionado, setDoctorSeleccionado] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [horarioEditar, setHorarioEditar] = useState(null);
  const [notification, setNotification] = useState(null);
  const [vistaCalendario, setVistaCalendario] = useState('semana'); // 'semana' o 'mes'
  const [fechaActual, setFechaActual] = useState(new Date());
  const [busquedaDoctor, setBusquedaDoctor] = useState('');
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const [formData, setFormData] = useState({
    dia_semana: 0, // 0=Lunes, 6=Domingo
    hora_inicio: '08:00',
    hora_fin: '18:00',
    duracion_bloque_minutos: 30,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: ''
  });

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  useEffect(() => {
    const abortController = new AbortController();
    cargarDoctores(abortController.signal);

    // Cleanup: cancelar peticiones pendientes cuando se desmonte
    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (doctorSeleccionado) {
      const abortController = new AbortController();
      cargarHorarios(abortController.signal);

      // Cleanup: cancelar peticiones pendientes cuando cambien los filtros
      return () => {
        abortController.abort();
      };
    }
  }, [doctorSeleccionado, fechaActual, vistaCalendario]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const showNotification = (type, message) => {
    setNotification({ id: Date.now(), type, message });
  };

  const cargarDoctores = async (signal) => {
    try {
      const response = await axios.get(`${API_URL}/Usuarios/listar-usuarios`, { signal });
      const doctoresFiltrados = (response.data?.usuarios || []).filter(u => u.rol_id === 2);
      setDoctores(doctoresFiltrados);
    } catch (error) {
      // Ignorar errores de cancelación
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log('Petición cancelada correctamente');
        return;
      }
      console.error('Error al cargar doctores:', error);
      showNotification('error', 'Error al cargar doctores');
    }
  };

  const cargarHorarios = async (signal) => {
    if (!doctorSeleccionado) return;

    setLoading(true);
    try {
      // Calcular rango de fechas según la vista
      let inicio, fin;

      if (vistaCalendario === 'semana') {
        // Para vista semanal: lunes a domingo de la semana actual
        const fechaBase = new Date(fechaActual);
        const diaSemana = fechaBase.getDay();
        const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
        fechaBase.setDate(fechaBase.getDate() + diasHastaLunes);

        const fechaInicioStr = fechaBase.toISOString().split('T')[0];

        fechaBase.setDate(fechaBase.getDate() + 6); // Domingo
        const fechaFinStr = fechaBase.toISOString().split('T')[0];

        inicio = getChileDayStart(fechaInicioStr);
        fin = getChileDayEnd(fechaFinStr);
      } else {
        // Para vista mensual: todo el mes
        const primerDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        const ultimoDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

        inicio = getChileDayStart(primerDia.toISOString().split('T')[0]);
        fin = getChileDayEnd(ultimoDia.toISOString().split('T')[0]);
      }

      console.log('DEBUG - Cargando horarios para rango:', inicio.toISOString(), 'a', fin.toISOString());

      const response = await axios.get(`${API_URL}/Horarios/listar-horarios`, {
        params: {
          usuario_sistema_id: doctorSeleccionado.id,
          fecha_inicio: inicio.toISOString(),
          fecha_fin: fin.toISOString()
        },
        signal
      });

      setHorarios(response.data.horarios || []);
    } catch (error) {
      // Ignorar errores de cancelación
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log('Petición cancelada correctamente');
        return;
      }
      console.error('Error al cargar horarios:', error);
      showNotification('error', 'Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  };

  const crearHorarioSemanal = async () => {
    if (!doctorSeleccionado) {
      showNotification('error', 'Debe seleccionar un doctor');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/Horarios/crear-horario-semanal`, {
        usuario_sistema_id: doctorSeleccionado.id,
        ...formData
      });
      
      showNotification('success', 'Horarios creados correctamente');
      setShowModal(false);
      cargarHorarios();
    } catch (error) {
      console.error('Error al crear horarios:', error);
      showNotification('error', error.response?.data?.detail || 'Error al crear horarios');
    } finally {
      setLoading(false);
    }
  };

  const eliminarHorario = async (horarioId) => {
    if (!confirm('¿Está seguro de eliminar este bloque de horario?')) return;

    try {
      await axios.delete(`${API_URL}/Horarios/eliminar-horario/${horarioId}`);
      showNotification('success', 'Horario eliminado correctamente');
      cargarHorarios();
    } catch (error) {
      console.error('Error al eliminar horario:', error);
      showNotification('error', 'Error al eliminar horario');
    }
  };

  const eliminarTodosHorarios = async () => {
    if (!doctorSeleccionado) return;
    if (!confirm('¿Está seguro de eliminar TODOS los horarios futuros de este doctor?')) return;

    try {
      await axios.delete(`${API_URL}/Horarios/eliminar-horarios-doctor/${doctorSeleccionado.id}`);
      showNotification('success', 'Todos los horarios fueron eliminados');
      cargarHorarios();
    } catch (error) {
      console.error('Error al eliminar horarios:', error);
      showNotification('error', 'Error al eliminar horarios');
    }
  };

  const formatearNombreCompleto = (persona) => {
    if (!persona) return '';
    return `${persona.nombre || ''} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim();
  };

  const doctoresFiltrados = doctores.filter(doctor => {
    if (!busquedaDoctor) return true;
    const nombreCompleto = formatearNombreCompleto(doctor).toLowerCase();
    return nombreCompleto.includes(busquedaDoctor.toLowerCase());
  });

  const formatearFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString('es-CL', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const agruparHorariosPorDia = () => {
    const grupos = {};
    horarios.forEach(h => {
      const fecha = new Date(h.inicio_bloque).toISOString().split('T')[0];
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(h);
    });
    return grupos;
  };

  const cambiarSemana = (direccion) => {
    const nueva = new Date(fechaActual);
    nueva.setDate(nueva.getDate() + (direccion * 7));
    setFechaActual(nueva);
  };

  const cambiarMes = (direccion) => {
    const nueva = new Date(fechaActual);
    nueva.setMonth(nueva.getMonth() + direccion);
    setFechaActual(nueva);
  };

  const obtenerDiasSemana = () => {
    const inicio = new Date(fechaActual);
    inicio.setDate(inicio.getDate() - inicio.getDay() + 1); // Lunes
    
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicio);
      dia.setDate(dia.getDate() + i);
      dias.push(dia);
    }
    return dias;
  };

  const obtenerDiasMes = () => {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    
    // Primer día del mes
    const primerDia = new Date(año, mes, 1);
    // Último día del mes
    const ultimoDia = new Date(año, mes + 1, 0);
    
    // Día de la semana del primer día (0=Dom, 1=Lun, etc.)
    const primerDiaSemana = primerDia.getDay();
    
    // Días del mes anterior para completar la primera semana
    const diasAnteriores = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
    
    const dias = [];
    
    // Agregar días del mes anterior
    for (let i = diasAnteriores; i > 0; i--) {
      const dia = new Date(año, mes, 1 - i);
      dias.push({ fecha: dia, esMesActual: false });
    }
    
    // Agregar días del mes actual
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      const dia = new Date(año, mes, i);
      dias.push({ fecha: dia, esMesActual: true });
    }
    
    // Agregar días del mes siguiente para completar la última semana
    const diasRestantes = 7 - (dias.length % 7);
    if (diasRestantes < 7) {
      for (let i = 1; i <= diasRestantes; i++) {
        const dia = new Date(año, mes + 1, i);
        dias.push({ fecha: dia, esMesActual: false });
      }
    }
    
    return dias;
  };

  const obtenerRangoHorariosDia = (fecha) => {
    const horariosDelDia = obtenerHorariosDia(fecha);
    if (horariosDelDia.length === 0) return null;
    
    const horas = horariosDelDia.map(h => ({
      inicio: new Date(h.inicio_bloque),
      fin: new Date(h.finalizacion_bloque)
    }));
    
    const horaInicio = horas.reduce((min, h) => h.inicio < min ? h.inicio : min, horas[0].inicio);
    const horaFin = horas.reduce((max, h) => h.fin > max ? h.fin : max, horas[0].fin);
    
    return {
      inicio: horaInicio.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      fin: horaFin.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      cantidad: horariosDelDia.length
    };
  };

  const obtenerHorariosDia = (fecha) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return horarios.filter(h => {
      const horarioFecha = new Date(h.inicio_bloque).toISOString().split('T')[0];
      return horarioFecha === fechaStr;
    }).sort((a, b) => new Date(a.inicio_bloque) - new Date(b.inicio_bloque));
  };

  const editarHorario = (horario) => {
    setHorarioEditar(horario);
    setShowEditModal(true);
  };

  const guardarEdicion = async () => {
    if (!horarioEditar) return;

    try {
      await axios.put(`${API_URL}/Horarios/modificar-horario/${horarioEditar.id}`, {
        inicio_bloque: horarioEditar.inicio_bloque,
        finalizacion_bloque: horarioEditar.finalizacion_bloque
      });
      
      showNotification('success', 'Horario actualizado correctamente');
      setShowEditModal(false);
      setHorarioEditar(null);
      cargarHorarios();
    } catch (error) {
      console.error('Error al actualizar horario:', error);
      showNotification('error', 'Error al actualizar horario');
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Horarios</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Asigna horarios de atención a los doctores</p>
          </div>
        </div>

        {/* Selector de Doctor */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Seleccionar Doctor
          </label>
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                value={doctorSeleccionado ? formatearNombreCompleto(doctorSeleccionado) : busquedaDoctor}
                onChange={(e) => {
                  setBusquedaDoctor(e.target.value);
                  setMostrarDropdown(true);
                  if (!e.target.value) {
                    setDoctorSeleccionado(null);
                  }
                }}
                onFocus={() => setMostrarDropdown(true)}
                placeholder="Buscar doctor por nombre..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {mostrarDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMostrarDropdown(false)}
                />
                <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {doctoresFiltrados.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No se encontraron doctores
                    </div>
                  ) : (
                    doctoresFiltrados.map((doctor) => (
                      <button
                        key={doctor.id}
                        onClick={() => {
                          setDoctorSeleccionado(doctor);
                          setBusquedaDoctor('');
                          setMostrarDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          doctorSeleccionado?.id === doctor.id
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        <div className="font-medium">{formatearNombreCompleto(doctor)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          RUT: {doctor.rut || 'N/A'}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {doctorSeleccionado && (
          <>
            {/* Acciones y Filtros */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear Horario Semanal
                </button>
                <button
                  onClick={eliminarTodosHorarios}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar Todos
                </button>
              </div>

              {/* Toggle Vista Semanal/Mensual */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setVistaCalendario('semana')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    vistaCalendario === 'semana'
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Semanal
                </button>
                <button
                  onClick={() => setVistaCalendario('mes')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    vistaCalendario === 'mes'
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Mensual
                </button>
              </div>
            </div>

            {/* Navegación */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => vistaCalendario === 'semana' ? cambiarSemana(-1) : cambiarMes(-1)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                    {fechaActual.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                  </p>
                  {vistaCalendario === 'semana' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Semana del {new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate() - fechaActual.getDay() + 1).toLocaleDateString('es-CL')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => vistaCalendario === 'semana' ? cambiarSemana(1) : cambiarMes(1)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Calendario */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Horarios de {formatearNombreCompleto(doctorSeleccionado)}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total de bloques: {horarios.length}
                </p>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando horarios...</div>
              ) : vistaCalendario === 'semana' ? (
                <div className="p-6">
                  {/* Grid de días de la semana */}
                  <div className="grid grid-cols-7 gap-2">
                    {obtenerDiasSemana().map((dia, index) => {
                      const horariosDelDia = obtenerHorariosDia(dia);
                      const esHoy = dia.toDateString() === new Date().toDateString();
                      
                      return (
                        <div key={index} className="min-h-[200px]">
                          {/* Header del día */}
                          <div className={`text-center p-3 rounded-t-lg ${
                            esHoy 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}>
                            <p className="text-xs font-semibold uppercase">
                              {dia.toLocaleDateString('es-CL', { weekday: 'short' })}
                            </p>
                            <p className="text-lg font-bold mt-1">
                              {dia.getDate()}
                            </p>
                          </div>

                          {/* Horarios del día */}
                          <div className="border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg p-2 space-y-2 min-h-[150px] bg-gray-50 dark:bg-gray-800/50">
                            {horariosDelDia.length === 0 ? (
                              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
                                Sin horarios
                              </p>
                            ) : (
                              horariosDelDia.map((horario) => (
                                <div
                                  key={horario.id}
                                  className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded p-2 hover:shadow-md transition-shadow cursor-pointer group"
                                  onClick={() => editarHorario(horario)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {new Date(horario.inicio_bloque).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        eliminarHorario(horario.id);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-opacity"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    {new Date(horario.finalizacion_bloque).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {Math.round((new Date(horario.finalizacion_bloque) - new Date(horario.inicio_bloque)) / 60000)} min
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {/* Headers días de la semana */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
                      <div key={dia} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase py-2">
                        {dia}
                      </div>
                    ))}
                  </div>

                  {/* Grid del mes */}
                  <div className="grid grid-cols-7 gap-2">
                    {obtenerDiasMes().map((diaObj, index) => {
                      const { fecha, esMesActual } = diaObj;
                      const rangoHorarios = obtenerRangoHorariosDia(fecha);
                      const esHoy = fecha.toDateString() === new Date().toDateString();
                      
                      return (
                        <div
                          key={index}
                          className={`min-h-[100px] border rounded-lg p-2 ${
                            esMesActual
                              ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                              : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-50'
                          } ${esHoy ? 'ring-2 ring-blue-500' : ''}`}
                        >
                          {/* Número del día */}
                          <div className={`text-sm font-semibold mb-2 ${
                            esHoy
                              ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center'
                              : esMesActual
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-400 dark:text-gray-600'
                          }`}>
                            {fecha.getDate()}
                          </div>

                          {/* Rango de horarios */}
                          {rangoHorarios && esMesActual && (
                            <div className="space-y-1">
                              <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded p-2 text-xs">
                                <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300 font-semibold">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {rangoHorarios.inicio}
                                </div>
                                <div className="text-blue-600 dark:text-blue-400 mt-1">
                                  {rangoHorarios.fin}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                                  {rangoHorarios.cantidad} bloques
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal Crear Horario Semanal */}
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Crear Horario Semanal</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Genera automáticamente bloques de horario para un día específico de la semana
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Día de la Semana *
                    </label>
                    <select
                      value={formData.dia_semana}
                      onChange={(e) => setFormData({...formData, dia_semana: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    >
                      {diasSemana.map((dia, index) => (
                        <option key={index} value={index}>{dia}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duración de Bloque (minutos) *
                    </label>
                    <select
                      value={formData.duracion_bloque_minutos}
                      onChange={(e) => setFormData({...formData, duracion_bloque_minutos: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    >
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>60 minutos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hora Inicio *
                    </label>
                    <input
                      type="time"
                      value={formData.hora_inicio}
                      onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hora Fin *
                    </label>
                    <input
                      type="time"
                      value={formData.hora_fin}
                      onChange={(e) => setFormData({...formData, hora_fin: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha Inicio *
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha Fin (opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_fin}
                      onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Si no se especifica, se crearán horarios por 3 meses
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                      <p className="font-semibold mb-1">Vista previa:</p>
                      <p>Se crearán bloques de <strong>{formData.duracion_bloque_minutos} minutos</strong> cada <strong>{diasSemana[formData.dia_semana]}</strong></p>
                      <p>Desde las <strong>{formData.hora_inicio}</strong> hasta las <strong>{formData.hora_fin}</strong></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearHorarioSemanal}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creando...' : 'Crear Horarios'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Editar Horario */}
      <AnimatePresence>
        {showEditModal && horarioEditar && (
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Horario</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora Inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={horarioEditar.inicio_bloque ? new Date(horarioEditar.inicio_bloque).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setHorarioEditar({...horarioEditar, inicio_bloque: new Date(e.target.value).toISOString()})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={horarioEditar.finalizacion_bloque ? new Date(horarioEditar.finalizacion_bloque).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setHorarioEditar({...horarioEditar, finalizacion_bloque: new Date(e.target.value).toISOString()})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    ⚠️ Asegúrate de que el nuevo horario no se solape con otros existentes
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setHorarioEditar(null);
                  }}
                  className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarEdicion}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold"
                >
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
