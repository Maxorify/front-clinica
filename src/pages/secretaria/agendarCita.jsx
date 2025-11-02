import { useState } from 'react';

export default function AgendarCita() {
  const [formData, setFormData] = useState({
    paciente: '',
    cedula: '',
    telefono: '',
    email: '',
    doctor: '',
    especialidad: '',
    fecha: '',
    hora: '',
    tipoCita: 'Primera vez',
    motivo: '',
    observaciones: ''
  });

  const doctores = [
    { id: 1, nombre: 'Dr. García', especialidad: 'Cardiología' },
    { id: 2, nombre: 'Dra. Martínez', especialidad: 'Pediatría' },
    { id: 3, nombre: 'Dr. Rodríguez', especialidad: 'Traumatología' },
    { id: 4, nombre: 'Dra. López', especialidad: 'Ginecología' },
  ];

  const horasDisponibles = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '14:00', '14:30', '15:00',
    '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Si se cambia el doctor, actualizar la especialidad automáticamente
    if (name === 'doctor') {
      const doctorSeleccionado = doctores.find(d => d.nombre === value);
      if (doctorSeleccionado) {
        setFormData(prev => ({
          ...prev,
          especialidad: doctorSeleccionado.especialidad
        }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Datos de la cita:', formData);
    // Aquí iría la lógica para guardar la cita
    alert('Cita agendada exitosamente');
  };

  const handleReset = () => {
    setFormData({
      paciente: '',
      cedula: '',
      telefono: '',
      email: '',
      doctor: '',
      especialidad: '',
      fecha: '',
      hora: '',
      tipoCita: 'Primera vez',
      motivo: '',
      observaciones: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agendar Cita</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Registra una nueva cita médica</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Paciente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Información del Paciente
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="paciente"
                value={formData.paciente}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
                placeholder="Ingrese nombre completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cédula de Identidad *
              </label>
              <input
                type="text"
                name="cedula"
                value={formData.cedula}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
                placeholder="Ej: 1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
                placeholder="Ej: 0987654321"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>
        </div>

        {/* Información de la Cita */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Detalles de la Cita
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Doctor *
              </label>
              <select
                name="doctor"
                value={formData.doctor}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
              >
                <option value="">Seleccione un doctor</option>
                {doctores.map((doctor) => (
                  <option key={doctor.id} value={doctor.nombre}>
                    {doctor.nombre} - {doctor.especialidad}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Especialidad
              </label>
              <input
                type="text"
                name="especialidad"
                value={formData.especialidad}
                readOnly
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white cursor-not-allowed"
                placeholder="Seleccione un doctor primero"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de la Cita *
              </label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora *
              </label>
              <select
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
              >
                <option value="">Seleccione una hora</option>
                {horasDisponibles.map((hora) => (
                  <option key={hora} value={hora}>{hora}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Cita *
              </label>
              <select
                name="tipoCita"
                value={formData.tipoCita}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
              >
                <option value="Primera vez">Primera vez</option>
                <option value="Control">Control</option>
                <option value="Urgencia">Urgencia</option>
                <option value="Seguimiento">Seguimiento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivo de Consulta *
              </label>
              <input
                type="text"
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
                placeholder="Ej: Dolor de cabeza"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
              placeholder="Información adicional sobre la cita..."
            />
          </div>
        </div>

        {/* Resumen de la Cita */}
        {formData.paciente && formData.doctor && formData.fecha && formData.hora && (
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl shadow-lg border border-amber-200 dark:border-amber-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resumen de la Cita
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Paciente:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">{formData.paciente}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Doctor:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">{formData.doctor}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {new Date(formData.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Hora:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">{formData.hora}</span>
              </div>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg transition-all font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Agendar Cita
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-semibold text-lg flex items-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
}
