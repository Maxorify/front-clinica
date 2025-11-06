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
    total_ingresos: 0
  });
  const [loading, setLoading] = useState(false);

  // Actualizar reloj cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    const abortController = new AbortController();
    cargarEstadisticas(abortController.signal);

    // Cleanup: cancelar peticiones pendientes cuando se desmonte el componente
    return () => {
      abortController.abort();
    };
  }, []);

  const cargarEstadisticas = async (signal) => {
    setLoading(true);
    try {
      const fechaHoy = new Date().toISOString().split('T')[0];

      // Obtener estadísticas de citas
      const citasResponse = await axios.get(`${API_URL}/Citas/estadisticas`, {
        params: { fecha: fechaHoy },
        signal
      });

      // Obtener ingresos del día
      const ingresosResponse = await axios.get(`${API_URL}/Citas/ingresos`, {
        params: { fecha: fechaHoy },
        signal
      });

      setEstadisticas({
        total_citas: citasResponse.data.total || 0,
        confirmadas: citasResponse.data.confirmadas || 0,
        pendientes: citasResponse.data.pendientes || 0,
        total_ingresos: ingresosResponse.data.total_ingresos || 0
      });
    } catch (error) {
      // Ignorar errores de cancelación
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log('Petición cancelada correctamente');
        return;
      }
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const citasHoy = [
    { id: 1, hora: '09:00', paciente: 'Mar�a Gonz�lez', doctor: 'Dr. Garc�a', estado: 'Confirmada' },
    { id: 2, hora: '09:30', paciente: 'Juan P�rez', doctor: 'Dra. Mart�nez', estado: 'En espera' },
    { id: 3, hora: '10:00', paciente: 'Ana L�pez', doctor: 'Dr. Garc�a', estado: 'En consulta' },
    { id: 4, hora: '10:30', paciente: 'Carlos Ruiz', doctor: 'Dr. Rodr�guez', estado: 'Confirmada' },
    { id: 5, hora: '11:00', paciente: 'Laura Torres', doctor: 'Dra. Mart�nez', estado: 'Pendiente' },
  ];

  const proximasTareas = [
    { id: 1, tarea: 'Confirmar cita de Carlos Ruiz', prioridad: 'Alta', hora: '10:15' },
    { id: 2, tarea: 'Llamar a Laura Torres', prioridad: 'Media', hora: '10:45' },
    { id: 3, tarea: 'Preparar documentos para nueva paciente', prioridad: 'Baja', hora: '11:30' },
  ];

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Confirmada':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'En espera':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'En consulta':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Pendiente':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'Alta':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'Media':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Baja':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Secretar�a</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Bienvenida, gestiona las operaciones del d�a</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Hora actual</p>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">{currentTime}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/secretaria/agendamiento')}
            className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
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
            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors group"
          >
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
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
            className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors group"
          >
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold opacity-90">Citas Hoy</h3>
              <p className="text-4xl font-bold mt-2">{loading ? '...' : estadisticas.total_citas}</p>
            </div>
            <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold opacity-90">Confirmadas</h3>
              <p className="text-4xl font-bold mt-2">{loading ? '...' : estadisticas.confirmadas}</p>
            </div>
            <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold opacity-90">Pendientes</h3>
              <p className="text-4xl font-bold mt-2">{loading ? '...' : estadisticas.pendientes}</p>
            </div>
            <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold opacity-90">Ingresos Hoy</h3>
              <p className="text-4xl font-bold mt-2">
                {loading ? '...' : `$${new Intl.NumberFormat('es-CL').format(estadisticas.total_ingresos)}`}
              </p>
            </div>
            <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Citas de Hoy */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Citas de Hoy</h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {citasHoy.map((cita) => (
              <div
                key={cita.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">{cita.hora}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{cita.paciente}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{cita.doctor}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(cita.estado)}`}>
                    {cita.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/secretaria/recepcion')}
            className="w-full mt-4 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium"
          >
            Ver Todas las Citas
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Acciones R�pidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
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
            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors group"
          >
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
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
            className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors group"
          >
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 dark:text-white">Sala de Espera</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Ver pacientes</p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors group">
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 dark:text-white">Reportes</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Ver reportes</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
