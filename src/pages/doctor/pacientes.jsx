import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  const pacientes = [
    {
      id: 1,
      nombre: 'Mar�a Gonz�lez',
      cedula: '1234567890',
      edad: 35,
      genero: 'Femenino',
      telefono: '0987654321',
      email: 'maria.gonzalez@email.com',
      direccion: 'Av. Principal #123, Quito',
      ultimaVisita: '2024-10-28',
      proximaCita: '2024-11-05',
      diagnostico: 'Hipertensi�n controlada',
      estado: 'Activo',
      grupo_sanguineo: 'O+',
      alergias: 'Penicilina'
    },
    {
      id: 2,
      nombre: 'Juan P�rez',
      cedula: '0987654321',
      edad: 42,
      genero: 'Masculino',
      telefono: '0991234567',
      email: 'juan.perez@email.com',
      direccion: 'Calle Secundaria #456, Quito',
      ultimaVisita: '2024-10-30',
      proximaCita: '2024-11-08',
      diagnostico: 'Diabetes tipo 2',
      estado: 'Activo',
      grupo_sanguineo: 'A+',
      alergias: 'Ninguna'
    },
    {
      id: 3,
      nombre: 'Ana L�pez',
      cedula: '1122334455',
      edad: 28,
      genero: 'Femenino',
      telefono: '0987123456',
      email: 'ana.lopez@email.com',
      direccion: 'Av. Universitaria #789, Quito',
      ultimaVisita: '2024-10-25',
      proximaCita: null,
      diagnostico: 'Paciente sano',
      estado: 'Activo',
      grupo_sanguineo: 'B+',
      alergias: 'Ninguna'
    },
    {
      id: 4,
      nombre: 'Carlos Ruiz',
      cedula: '5544332211',
      edad: 51,
      genero: 'Masculino',
      telefono: '0998765432',
      email: 'carlos.ruiz@email.com',
      direccion: 'Calle Las Flores #321, Quito',
      ultimaVisita: '2024-09-15',
      proximaCita: '2024-11-10',
      diagnostico: 'Artritis reumatoide',
      estado: 'Inactivo',
      grupo_sanguineo: 'AB+',
      alergias: 'Aspirina, Polen'
    },
    {
      id: 5,
      nombre: 'Laura Mart�nez',
      cedula: '6677889900',
      edad: 39,
      genero: 'Femenino',
      telefono: '0987777888',
      email: 'laura.martinez@email.com',
      direccion: 'Av. Los Pinos #654, Quito',
      ultimaVisita: '2024-10-29',
      proximaCita: '2024-11-03',
      diagnostico: 'Control prenatal',
      estado: 'Activo',
      grupo_sanguineo: 'O-',
      alergias: 'Ninguna'
    }
  ];

  const filteredPacientes = pacientes.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       p.cedula.includes(searchTerm) ||
                       p.telefono.includes(searchTerm);
    const matchEstado = filtroEstado === 'Todos' || p.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  const handleVerDetalles = (paciente) => {
    setSelectedPaciente(paciente);
    setShowModal(true);
  };

  const calcularEdad = (edad) => {
    return edad;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Pacientes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Gesti�n de pacientes asignados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Total Pacientes</h3>
          <p className="text-4xl font-bold mt-2">{pacientes.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Activos</h3>
          <p className="text-4xl font-bold mt-2">{pacientes.filter(p => p.estado === 'Activo').length}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Citas Pr�ximas</h3>
          <p className="text-4xl font-bold mt-2">{pacientes.filter(p => p.proximaCita).length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Nuevos (mes)</h3>
          <p className="text-4xl font-bold mt-2">3</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar por nombre, c�dula o tel�fono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white"
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
          <div className="flex gap-2">
            {['Todos', 'Activo', 'Inactivo'].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtroEstado === estado
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {estado}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPacientes.map((paciente) => (
          <div
            key={paciente.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
                  {paciente.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{paciente.nombre}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{paciente.edad} a�os - {paciente.genero}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">CI: {paciente.cedula}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                paciente.estado === 'Activo'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
              }`}>
                {paciente.estado}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">�ltima visita:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(paciente.ultimaVisita).toLocaleDateString('es-ES')}
                </span>
              </div>
              {paciente.proximaCita && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Pr�xima cita:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {new Date(paciente.proximaCita).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Diagn�stico:</span>
                <span className="font-medium text-gray-900 dark:text-white">{paciente.diagnostico}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleVerDetalles(paciente)}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Ver Detalles
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
                Ver Historia
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No se encontraron pacientes</h3>
          <p className="text-gray-600 dark:text-gray-400">No hay pacientes que coincidan con los criterios de b�squeda</p>
        </div>
      )}

      {/* Patient Details Modal */}
      <AnimatePresence>
        {showModal && selectedPaciente && (
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-3xl font-bold">
                    {selectedPaciente.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedPaciente.nombre}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{selectedPaciente.edad} a�os - {selectedPaciente.genero}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Informaci�n Personal */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Informaci�n Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">C�dula</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedPaciente.cedula}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Grupo Sangu�neo</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedPaciente.grupo_sanguineo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tel�fono</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedPaciente.telefono}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedPaciente.email}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Direcci�n</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedPaciente.direccion}</p>
                  </div>
                </div>
              </div>

              {/* Informaci�n M�dica */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Informaci�n M�dica
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Diagn�stico Principal</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedPaciente.diagnostico}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Alergias</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedPaciente.alergias}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">�ltima Visita</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(selectedPaciente.ultimaVisita).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    {selectedPaciente.proximaCita && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Pr�xima Cita</p>
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          {new Date(selectedPaciente.proximaCita).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-semibold">
                  Ver Historia Completa
                </button>
                <button className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold">
                  Nueva Consulta
                </button>
              </div>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
