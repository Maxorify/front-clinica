import { useState } from 'react';

export default function HistoriaMedica() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [selectedConsulta, setSelectedConsulta] = useState(null);
  const [showConsultaModal, setShowConsultaModal] = useState(false);
  const [activeTab, setActiveTab] = useState('consultas');

  // Datos de ejemplo
  const pacientes = [
    { id: 1, nombre: 'María González', cedula: '1234567890', edad: 35 },
    { id: 2, nombre: 'Juan Pérez', cedula: '0987654321', edad: 42 },
    { id: 3, nombre: 'Ana López', cedula: '1122334455', edad: 28 },
    { id: 4, nombre: 'Carlos Ruiz', cedula: '5544332211', edad: 51 },
  ];

  const historialMedico = {
    1: {
      consultas: [
        {
          id: 1,
          fecha: '2024-10-28',
          hora: '09:00',
          motivo: 'Control general',
          sintomas: 'Dolor de cabeza ocasional, fatiga',
          diagnostico: 'Hipertensión arterial controlada',
          tratamiento: 'Losartán 50mg cada 12 horas',
          observaciones: 'Paciente presenta mejoría. Continuar con tratamiento actual.',
          presionArterial: '130/85',
          peso: '68kg',
          altura: '165cm',
          temperatura: '36.5°C'
        },
        {
          id: 2,
          fecha: '2024-09-15',
          hora: '10:30',
          motivo: 'Seguimiento hipertensión',
          sintomas: 'Ninguno',
          diagnostico: 'Hipertensión arterial en tratamiento',
          tratamiento: 'Losartán 50mg cada 12 horas',
          observaciones: 'Valores de presión arterial estables.',
          presionArterial: '125/80',
          peso: '67kg',
          altura: '165cm',
          temperatura: '36.8°C'
        }
      ],
      examenes: [
        {
          id: 1,
          fecha: '2024-10-20',
          tipo: 'Exámenes de sangre',
          descripcion: 'Perfil lipídico completo',
          resultado: 'Normal',
          observaciones: 'Colesterol: 180 mg/dL, Triglicéridos: 120 mg/dL'
        },
        {
          id: 2,
          fecha: '2024-09-10',
          tipo: 'Electrocardiograma',
          descripcion: 'ECG de rutina',
          resultado: 'Normal',
          observaciones: 'Ritmo sinusal normal'
        }
      ],
      recetas: [
        {
          id: 1,
          fecha: '2024-10-28',
          medicamentos: [
            { nombre: 'Losartán', dosis: '50mg', frecuencia: 'Cada 12 horas', duracion: '30 días' },
            { nombre: 'Ácido acetilsalicílico', dosis: '100mg', frecuencia: 'Una vez al día', duracion: '30 días' }
          ]
        }
      ],
      vacunas: [
        { id: 1, nombre: 'Influenza', fecha: '2024-04-15', proximaDosis: '2025-04-15' },
        { id: 2, nombre: 'COVID-19', fecha: '2023-12-10', proximaDosis: null }
      ]
    }
  };

  const handleSeleccionarPaciente = (paciente) => {
    setSelectedPaciente(paciente);
    setActiveTab('consultas');
  };

  const handleVerConsulta = (consulta) => {
    setSelectedConsulta(consulta);
    setShowConsultaModal(true);
  };

  const filteredPacientes = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cedula.includes(searchTerm)
  );

  const historiaActual = selectedPaciente ? historialMedico[selectedPaciente.id] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Historia Médica</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Consulta el historial médico de tus pacientes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Pacientes */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Pacientes</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {filteredPacientes.map((paciente) => (
                <button
                  key={paciente.id}
                  onClick={() => handleSeleccionarPaciente(paciente)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    selectedPaciente?.id === paciente.id
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <h3 className="font-semibold">{paciente.nombre}</h3>
                  <p className={`text-sm ${
                    selectedPaciente?.id === paciente.id ? 'text-green-100' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    CI: {paciente.cedula} - {paciente.edad} años
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Historia Médica */}
        <div className="lg:col-span-2">
          {!selectedPaciente ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <svg className="w-20 h-20 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Selecciona un paciente
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Selecciona un paciente de la lista para ver su historia médica
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              {/* Patient Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-500 to-green-600">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-green-600 text-2xl font-bold">
                    {selectedPaciente.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="text-white">
                    <h2 className="text-2xl font-bold">{selectedPaciente.nombre}</h2>
                    <p className="text-green-100">CI: {selectedPaciente.cedula} - {selectedPaciente.edad} años</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex overflow-x-auto">
                  {[
                    { id: 'consultas', label: 'Consultas', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                    { id: 'examenes', label: 'Exámenes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                    { id: 'recetas', label: 'Recetas', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                    { id: 'vacunas', label: 'Vacunas', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                      </svg>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Consultas Tab */}
                {activeTab === 'consultas' && historiaActual?.consultas && (
                  <div className="space-y-4">
                    {historiaActual.consultas.map((consulta) => (
                      <div
                        key={consulta.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => handleVerConsulta(consulta)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{consulta.motivo}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(consulta.fecha).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })} - {consulta.hora}
                            </p>
                          </div>
                          <button className="text-green-600 hover:text-green-700 dark:text-green-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Diagnóstico:</span> {consulta.diagnostico}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Exámenes Tab */}
                {activeTab === 'examenes' && historiaActual?.examenes && (
                  <div className="space-y-4">
                    {historiaActual.examenes.map((examen) => (
                      <div key={examen.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{examen.tipo}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(examen.fecha).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            examen.resultado === 'Normal'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {examen.resultado}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{examen.descripcion}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Observaciones:</span> {examen.observaciones}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recetas Tab */}
                {activeTab === 'recetas' && historiaActual?.recetas && (
                  <div className="space-y-4">
                    {historiaActual.recetas.map((receta) => (
                      <div key={receta.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            Receta - {new Date(receta.fecha).toLocaleDateString('es-ES')}
                          </h3>
                          <button className="text-green-600 hover:text-green-700 dark:text-green-400 text-sm font-medium">
                            Imprimir
                          </button>
                        </div>
                        <div className="space-y-3">
                          {receta.medicamentos.map((med, idx) => (
                            <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                              <p className="font-semibold text-gray-900 dark:text-white">{med.nombre}</p>
                              <div className="grid grid-cols-3 gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <div>
                                  <span className="font-medium">Dosis:</span> {med.dosis}
                                </div>
                                <div>
                                  <span className="font-medium">Frecuencia:</span> {med.frecuencia}
                                </div>
                                <div>
                                  <span className="font-medium">Duración:</span> {med.duracion}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Vacunas Tab */}
                {activeTab === 'vacunas' && historiaActual?.vacunas && (
                  <div className="space-y-4">
                    {historiaActual.vacunas.map((vacuna) => (
                      <div key={vacuna.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{vacuna.nombre}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Última dosis: {new Date(vacuna.fecha).toLocaleDateString('es-ES')}
                            </p>
                            {vacuna.proximaDosis && (
                              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                Próxima dosis: {new Date(vacuna.proximaDosis).toLocaleDateString('es-ES')}
                              </p>
                            )}
                          </div>
                          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Consulta Detail Modal */}
      {showConsultaModal && selectedConsulta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-500 to-green-600">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h2 className="text-2xl font-bold">{selectedConsulta.motivo}</h2>
                  <p className="text-green-100">
                    {new Date(selectedConsulta.fecha).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} - {selectedConsulta.hora}
                  </p>
                </div>
                <button
                  onClick={() => setShowConsultaModal(false)}
                  className="text-white hover:text-green-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Signos Vitales */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Signos Vitales</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Presión Arterial</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedConsulta.presionArterial}</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Peso</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedConsulta.peso}</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Altura</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedConsulta.altura}</p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Temperatura</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedConsulta.temperatura}</p>
                  </div>
                </div>
              </div>

              {/* Síntomas */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Síntomas</h3>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  {selectedConsulta.sintomas}
                </p>
              </div>

              {/* Diagnóstico */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Diagnóstico</h3>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  {selectedConsulta.diagnostico}
                </p>
              </div>

              {/* Tratamiento */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tratamiento</h3>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  {selectedConsulta.tratamiento}
                </p>
              </div>

              {/* Observaciones */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Observaciones</h3>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  {selectedConsulta.observaciones}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-semibold">
                  Imprimir Consulta
                </button>
                <button
                  onClick={() => setShowConsultaModal(false)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
