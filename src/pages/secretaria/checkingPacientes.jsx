import { useState } from 'react';

export default function CheckingPacientes() {
  const [searchTerm, setSearchTerm] = useState('');

  const pacientesEspera = [
    {
      id: 1,
      nombre: 'María González',
      cedula: '1234567890',
      doctor: 'Dr. García',
      horaCita: '09:00',
      horaLlegada: '08:55',
      estado: 'En espera',
      prioridad: 'Normal'
    },
    {
      id: 2,
      nombre: 'Juan Pérez',
      cedula: '0987654321',
      doctor: 'Dra. Martínez',
      horaCita: '09:30',
      horaLlegada: '09:25',
      estado: 'En espera',
      prioridad: 'Normal'
    },
    {
      id: 3,
      nombre: 'Ana López',
      cedula: '1122334455',
      doctor: 'Dr. García',
      horaCita: '10:00',
      horaLlegada: '09:50',
      estado: 'En consulta',
      prioridad: 'Normal'
    },
    {
      id: 4,
      nombre: 'Carlos Ruiz',
      cedula: '5544332211',
      doctor: 'Dr. Rodríguez',
      horaCita: '10:30',
      horaLlegada: '10:15',
      estado: 'En espera',
      prioridad: 'Urgente'
    },
  ];

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'En espera':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'En consulta':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Atendido':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPrioridadColor = (prioridad) => {
    return prioridad === 'Urgente'
      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const filteredPacientes = pacientesEspera.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cedula.includes(searchTerm) ||
      p.doctor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Checking de Pacientes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Control de llegada y sala de espera</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Total en Sala</h3>
          <p className="text-4xl font-bold mt-2">4</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">En Espera</h3>
          <p className="text-4xl font-bold mt-2">3</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">En Consulta</h3>
          <p className="text-4xl font-bold mt-2">1</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Urgentes</h3>
          <p className="text-4xl font-bold mt-2">1</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
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

      {/* Patients Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPacientes.map((paciente) => (
          <div
            key={paciente.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-2xl font-bold">
                  {paciente.nombre.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{paciente.nombre}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">CI: {paciente.cedula}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(paciente.estado)}`}>
                  {paciente.estado}
                </span>
                {paciente.prioridad === 'Urgente' && (
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPrioridadColor(paciente.prioridad)}`}>
                    {paciente.prioridad}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Doctor:</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{paciente.doctor}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Hora cita:</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{paciente.horaCita}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Llegada:</span>
                </div>
                <span className="font-medium text-green-600 dark:text-green-400">{paciente.horaLlegada}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              {paciente.estado === 'En espera' && (
                <button className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
                  Llamar a Consulta
                </button>
              )}
              {paciente.estado === 'En consulta' && (
                <button className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium">
                  Finalizar Consulta
                </button>
              )}
              <button className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium">
                Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPacientes.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No hay pacientes en espera</h3>
          <p className="text-gray-600 dark:text-gray-400">No se encontraron pacientes con los criterios de búsqueda</p>
        </div>
      )}
    </div>
  );
}
