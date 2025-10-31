import { useState } from 'react';

export default function CitasDoctor() {
  const [selectedDate, setSelectedDate] = useState('2024-10-31');

  const citas = [
    { id: 1, hora: '09:00', paciente: 'María González', edad: 35, motivo: 'Control general', estado: 'Completada' },
    { id: 2, hora: '10:00', paciente: 'Juan Pérez', edad: 42, motivo: 'Dolor de cabeza', estado: 'En proceso' },
    { id: 3, hora: '11:30', paciente: 'Ana López', edad: 28, motivo: 'Consulta de rutina', estado: 'Pendiente' },
    { id: 4, hora: '14:00', paciente: 'Carlos Ruiz', edad: 51, motivo: 'Seguimiento', estado: 'Pendiente' },
    { id: 5, hora: '15:30', paciente: 'Laura Martínez', edad: 39, motivo: 'Resultado de exámenes', estado: 'Pendiente' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Citas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gestión de citas médicas</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
        />
      </div>

      <div className="grid gap-4">
        {citas.map((cita) => (
          <div key={cita.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-green-500 text-white rounded-lg px-4 py-3 text-center">
                  <div className="text-2xl font-bold">{cita.hora.split(':')[0]}</div>
                  <div className="text-xs">{cita.hora.split(':')[1]}</div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{cita.paciente}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{cita.edad} años - {cita.motivo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  cita.estado === 'Completada' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  cita.estado === 'En proceso' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {cita.estado}
                </span>
                <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
