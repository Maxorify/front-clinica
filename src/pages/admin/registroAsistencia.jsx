export default function RegistroAsistencia() {
  const asistencias = [
    { id: 1, empleado: 'Dr. García', fecha: '2024-10-31', horaEntrada: '07:55', horaSalida: '16:05', estado: 'Presente' },
    { id: 2, empleado: 'Dra. Martínez', fecha: '2024-10-31', horaEntrada: '08:45', horaSalida: '-', estado: 'Presente' },
    { id: 3, empleado: 'María Secretaria', fecha: '2024-10-31', horaEntrada: '05:58', horaSalida: '-', estado: 'Presente' },
    { id: 4, empleado: 'Dr. Rodríguez', fecha: '2024-10-31', horaEntrada: '10:15', horaSalida: '-', estado: 'Tarde' },
    { id: 5, empleado: 'Juan Recepción', fecha: '2024-10-31', horaEntrada: '-', horaSalida: '-', estado: 'Ausente' },
  ];

  const getEstadoBadge = (estado) => {
    const colors = {
      'Presente': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'Tarde': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'Ausente': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Registro de Asistencia</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Control de asistencia del personal</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            defaultValue="2024-10-31"
          />
          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-lg">
            Filtrar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Presentes</h3>
          <p className="text-4xl font-bold mt-2">3</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Tardes</h3>
          <p className="text-4xl font-bold mt-2">1</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Ausentes</h3>
          <p className="text-4xl font-bold mt-2">1</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Total Personal</h3>
          <p className="text-4xl font-bold mt-2">5</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empleado</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hora Entrada</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hora Salida</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {asistencias.map((asistencia) => (
                <tr key={asistencia.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{asistencia.empleado}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{asistencia.fecha}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{asistencia.horaEntrada}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{asistencia.horaSalida}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(asistencia.estado)}`}>
                      {asistencia.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
