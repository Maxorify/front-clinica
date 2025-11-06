import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    {
      title: 'Total Pacientes',
      value: '0',
      change: '+0%',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'blue',
    },
    {
      title: 'Citas Hoy',
      value: '0',
      change: '+0%',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'green',
    },
    {
      title: 'Doctores Activos',
      value: '0',
      change: '+0',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'purple',
    },
    {
      title: 'Ingresos del Mes',
      value: '$0',
      change: '+0%',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'yellow',
    },
  ]);

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();
    cargarDatosDashboard(abortController.signal);

    // Cleanup: cancelar peticiones pendientes cuando se desmonte el componente
    return () => {
      abortController.abort();
    };
  }, []);

  const cargarDatosDashboard = async (signal) => {
    setLoading(true);
    try {
      // Cargar estadísticas
      const statsResponse = await axios.get(`${API_URL}/Dashboard/estadisticas`, { signal });
      const estadisticas = statsResponse.data?.estadisticas || {};

      // Actualizar stats con datos reales
      setStats([
        {
          title: 'Total Pacientes',
          value: estadisticas.total_pacientes?.toString() || '0',
          change: estadisticas.cambio_pacientes || '+0%',
          icon: stats[0].icon,
          color: 'blue',
        },
        {
          title: 'Citas Hoy',
          value: estadisticas.citas_hoy?.toString() || '0',
          change: estadisticas.cambio_citas || '+0%',
          icon: stats[1].icon,
          color: 'green',
        },
        {
          title: 'Doctores Activos',
          value: estadisticas.doctores_activos?.toString() || '0',
          change: estadisticas.cambio_doctores || '+0',
          icon: stats[2].icon,
          color: 'purple',
        },
        {
          title: 'Ingresos del Mes',
          value: `$${estadisticas.ingresos_mes?.toLocaleString('es-CL') || '0'}`,
          change: estadisticas.cambio_ingresos || '+0%',
          icon: stats[3].icon,
          color: 'yellow',
        },
      ]);

      // Cargar citas recientes
      const citasResponse = await axios.get(`${API_URL}/Dashboard/citas-recientes?limite=5`, { signal });
      setRecentAppointments(citasResponse.data?.citas || []);

    } catch (error) {
      // Ignorar errores de cancelación
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log('Petición cancelada correctamente');
        return;
      }
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 from-blue-500 to-blue-600',
      green: 'bg-green-500 from-green-500 to-green-600',
      purple: 'bg-purple-500 from-purple-500 to-purple-600',
      yellow: 'bg-yellow-500 from-yellow-500 to-yellow-600',
    };
    return colors[color];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmada':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'En espera':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Cancelada':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Bienvenido al panel de administración</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</h3>
                <p className={`text-sm mt-2 font-medium ${
                  stat.change.startsWith('+') || stat.change.startsWith('-')
                    ? stat.change.startsWith('+')
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {stat.change}
                </p>
              </div>
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getColorClasses(stat.color)} flex items-center justify-center text-white shadow-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Citas Recientes</h2>
          {recentAppointments.length > 0 ? (
            <div className="space-y-4">
              {recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{appointment.patient}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.doctor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{appointment.time}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay citas programadas para hoy
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/admin/agendamiento-consultas')}
              className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 flex flex-col items-center gap-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-medium">Nueva Cita</span>
            </button>
            <button
              onClick={() => navigate('/admin/pacientes')}
              className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 flex flex-col items-center gap-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="font-medium">Nuevo Paciente</span>
            </button>
            <button
              onClick={() => navigate('/admin/agendamiento-consultas')}
              className="p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors duration-200 flex flex-col items-center gap-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">Reportes</span>
            </button>
            <button
              onClick={() => navigate('/admin/usuarios-sistema')}
              className="p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 flex flex-col items-center gap-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="font-medium">Usuarios</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
