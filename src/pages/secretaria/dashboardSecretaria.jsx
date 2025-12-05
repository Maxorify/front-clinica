import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export default function DashboardSecretaria() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
  const [estadisticas, setEstadisticas] = useState({
    total_citas: 0,
    confirmadas: 0,
    pendientes: 0,
    en_consulta: 0,
    total_ingresos: 0
  });
  const [citasPendientes, setCitasPendientes] = useState([]);
  const [actividadReciente, setActividadReciente] = useState({
    pagos_recientes: [],
    citas_recientes: []
  });
  const [loading, setLoading] = useState(false);

  // Actualizar reloj cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    const abortController = new AbortController();
    cargarDatos(abortController.signal);

    // Cleanup: cancelar peticiones pendientes cuando se desmonte el componente
    return () => {
      abortController.abort();
    };
  }, []);

  const cargarDatos = async (signal) => {
    setLoading(true);
    try {
      // Obtener fecha local en formato YYYY-MM-DD (NO usar UTC)
      const hoy = new Date();
      const año = hoy.getFullYear();
      const mes = String(hoy.getMonth() + 1).padStart(2, '0');
      const dia = String(hoy.getDate()).padStart(2, '0');
      const fechaHoy = `${año}-${mes}-${dia}`;

      // Llamadas en paralelo
      const [estadisticasRes, citasPendientesRes, actividadRes, ingresosRes] = await Promise.all([
        axios.get(`${API_URL}/Citas/estadisticas`, { params: { fecha: fechaHoy }, signal }),
        axios.get(`${API_URL}/Citas/hoy/pendientes`, { signal }),
        axios.get(`${API_URL}/Citas/actividad-reciente`, { signal }),
        axios.get(`${API_URL}/Citas/ingresos`, { params: { fecha: fechaHoy }, signal })
      ]);

      setEstadisticas({
        total_citas: estadisticasRes.data.total || 0,
        confirmadas: estadisticasRes.data.confirmadas || 0,
        pendientes: estadisticasRes.data.pendientes || 0,
        en_consulta: estadisticasRes.data.en_consulta || 0,
        total_ingresos: ingresosRes.data.total_ingresos || 0
      });

      setCitasPendientes(citasPendientesRes.data.citas || []);
      setActividadReciente(actividadRes.data || { pagos_recientes: [], citas_recientes: [] });

    } catch (error) {
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log('Petición cancelada correctamente');
        return;
      }
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCitaClick = (citaId) => {
    navigate(`/secretaria/recepcion?citaId=${citaId}`);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Confirmada':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Pendiente':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'En Consulta':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Completada':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatearHora = (fechaISO) => {
    if (!fechaISO) return '--:--';
    const fecha = new Date(fechaISO);
    console.log('Fecha ISO recibida:', fechaISO, '-> Convertida a local:', fecha.toString());
    return fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' });
  };

  const formatearFechaHora = (fechaISO) => {
    if (!fechaISO) return '--:--:--';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Santiago' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/30 to-gray-50 dark:from-gray-900 dark:via-amber-950/20 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Dashboard Secretaría</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">Bienvenida, gestiona las operaciones del día</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{currentTime}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Hora actual</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Acciones Rápidas</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Operaciones principales del día</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/secretaria/agendamiento')}
                className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Nueva Cita</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Agendar cita</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/secretaria/recepcion')}
                className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Recepción</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Procesar pagos</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/secretaria/recepcion')}
                className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Sala de Espera</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Ver pacientes</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-2xl">
                📅
              </div>
            </div>
            <div className="text-4xl font-bold text-blue-600 dark:text-white mb-1">{loading ? '...' : estadisticas.total_citas}</div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Citas Hoy</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-2xl">
                ✓
              </div>
            </div>
            <div className="text-4xl font-bold text-green-600 dark:text-white mb-1">{loading ? '...' : estadisticas.confirmadas}</div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Confirmadas</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-2xl">
                ⏱
              </div>
            </div>
            <div className="text-4xl font-bold text-amber-600 dark:text-white mb-1">{loading ? '...' : estadisticas.pendientes}</div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-2xl">
                💰
              </div>
            </div>
            <div className="text-4xl font-bold text-purple-600 dark:text-white mb-1">
              {loading ? '...' : `$${new Intl.NumberFormat('es-CL').format(estadisticas.total_ingresos)}`}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Ingresos Hoy</div>
          </div>
        </div>

        {/* Layout de 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Citas Pendientes del Día - 2 columnas */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Citas Pendientes del Día</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Próximas a atender - Click para procesar pago
                </p>
              </div>
              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-3 py-1 rounded-full text-sm font-medium">
                {citasPendientes.length} pendientes
              </span>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando...</div>
              ) : citasPendientes.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No hay citas pendientes</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Todas las citas del día están confirmadas</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {citasPendientes.map((cita) => (
                    <div
                      key={cita.id}
                      onClick={() => handleCitaClick(cita.id)}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer group border-l-4 border-amber-500"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                          <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">{formatearHora(cita.fecha_atencion)}</p>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                            {cita.paciente?.nombre} {cita.paciente?.apellido_paterno} {cita.paciente?.apellido_materno}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Doctor:</span> Dr. {cita.doctor?.nombre} {cita.doctor?.apellido_paterno}
                            </p>
                            {cita.especialidad && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded-full">
                                {cita.especialidad.nombre}
                              </span>
                            )}
                          </div>
                          {cita.paciente?.telefono && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Tel: {cita.paciente.telefono}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(cita.estado_actual)}`}>
                          {cita.estado_actual}
                        </span>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actividad Reciente - 1 columna */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Actividad Reciente</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Últimas operaciones del día</p>
            </div>
            <div className="p-6">
              <div className="space-y-6 max-h-[600px] overflow-y-auto">

                {/* Pagos Recientes */}
                {actividadReciente.pagos_recientes?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Pagos Procesados
                    </h3>
                    <div className="space-y-2">
                      {actividadReciente.pagos_recientes.slice(0, 5).map((pago) => (
                        <div key={pago.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {pago.paciente?.nombre} {pago.paciente?.apellido_paterno}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{pago.tipo_pago} - {formatearFechaHora(pago.fecha_pago)}</p>
                          </div>
                          <span className="text-sm font-bold text-green-700 dark:text-green-400">
                            ${new Intl.NumberFormat('es-CL').format(pago.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Citas Recientes */}
                {actividadReciente.citas_recientes?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Últimas Citas
                    </h3>
                    <div className="space-y-2">
                      {actividadReciente.citas_recientes.slice(0, 5).map((cita) => (
                        <div key={cita.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {cita.paciente?.nombre} {cita.paciente?.apellido_paterno}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(cita.estado_actual)}`}>
                              {cita.estado_actual}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Dr. {cita.doctor?.nombre} {cita.doctor?.apellido_paterno} - {formatearHora(cita.fecha_atencion)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {actividadReciente.pagos_recientes?.length === 0 && actividadReciente.citas_recientes?.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-400">No hay actividad reciente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
