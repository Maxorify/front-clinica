export default function DashboardDoctor() {
  const stats = [
    { title: 'Citas Hoy', value: '12', color: 'from-blue-500 to-blue-600' },
    { title: 'Pacientes Atendidos', value: '8', color: 'from-green-500 to-green-600' },
    { title: 'Pendientes', value: '4', color: 'from-yellow-500 to-yellow-600' },
    { title: 'Total Pacientes', value: '156', color: 'from-purple-500 to-purple-600' },
  ];

  const citasHoy = [
    { hora: '09:00', paciente: 'María González', motivo: 'Control general', estado: 'Completada' },
    { hora: '10:00', paciente: 'Juan Pérez', motivo: 'Dolor de cabeza', estado: 'En proceso' },
    { hora: '11:30', paciente: 'Ana López', motivo: 'Consulta de rutina', estado: 'Pendiente' },
    { hora: '14:00', paciente: 'Carlos Ruiz', motivo: 'Seguimiento', estado: 'Pendiente' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Doctor</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Bienvenido Dr. García</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`bg-gradient-to-br ${stat.color} rounded-xl shadow-lg p-6 text-white`}>
            <h3 className="text-lg font-semibold opacity-90">{stat.title}</h3>
            <p className="text-4xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Citas de Hoy</h2>
        <div className="space-y-4">
          {citasHoy.map((cita, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{cita.hora}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{cita.paciente}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{cita.motivo}</p>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                cita.estado === 'Completada' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                cita.estado === 'En proceso' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {cita.estado}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
