import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { generarRecetaPDF } from "../../utils/generarRecetaPDF";

export default function HistoriaMedica() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [selectedConsulta, setSelectedConsulta] = useState(null);
  const [showConsultaModal, setShowConsultaModal] = useState(false);

  // Estados para los datos del backend
  const [pacientes, setPacientes] = useState([]);
  const [historialConsultas, setHistorialConsultas] = useState([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const pacientesPorPagina = 5;

  // Notificaciones
  const [notificacion, setNotificacion] = useState({
    show: false,
    mensaje: "",
    tipo: "",
  });

  // Cargar pacientes atendidos por el doctor al montar el componente
  useEffect(() => {
    cargarPacientesAtendidos();
  }, []);

  const cargarPacientesAtendidos = async () => {
    setLoadingPacientes(true);
    try {
      const doctorId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");

      const response = await axios.get(
        `http://localhost:5000/Citas/doctor/${doctorId}/pacientes-atendidos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPacientes(response.data.pacientes || []);
    } catch (error) {
      console.error("Error al cargar pacientes atendidos:", error);
      mostrarNotificacion("Error al cargar la lista de pacientes", "error");
      setPacientes([]);
    } finally {
      setLoadingPacientes(false);
    }
  };

  const cargarHistorialPaciente = async (pacienteId) => {
    setLoadingHistorial(true);
    try {
      const token = localStorage.getItem("access_token");

      const response = await axios.get(
        `http://localhost:5000/Citas/paciente/${pacienteId}/historial-medico`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHistorialConsultas(response.data.historial || []);
    } catch (error) {
      console.error("Error al cargar historial médico:", error);
      mostrarNotificacion("Error al cargar el historial médico", "error");
      setHistorialConsultas([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleSeleccionarPaciente = (paciente) => {
    setSelectedPaciente(paciente);
    setPaginaActual(1);
    cargarHistorialPaciente(paciente.id);
  };

  const handleVerConsulta = (consulta) => {
    setSelectedConsulta(consulta);
    setShowConsultaModal(true);
  };

  const handleGenerarReceta = async (consulta) => {
    if (!consulta.recetas || consulta.recetas.length === 0) {
      mostrarNotificacion(
        "Esta consulta no tiene recetas registradas",
        "error"
      );
      return;
    }

    try {
      const doctorId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");

      // Obtener datos del doctor
      const doctorResponse = await axios.get(
        `http://localhost:5000/Usuarios/usuario/${doctorId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const doctor = doctorResponse.data;

      // Preparar datos para el PDF en el formato correcto (un solo objeto)
      const datosPDF = {
        paciente: {
          nombre: selectedPaciente.nombre_completo,
          rut: selectedPaciente.rut,
          edad: selectedPaciente.edad,
        },
        doctor: {
          nombre: `${doctor.nombre} ${doctor.apellido_paterno} ${
            doctor.apellido_materno || ""
          }`.trim(),
          especialidad: consulta.especialidad?.nombre || "Medicina General",
          rut: doctor.rut || "",
        },
        recetas: consulta.recetas.map((receta) => ({
          nombre: receta.nombre,
          presentacion: receta.presentacion || "",
          dosis: receta.dosis || "",
          duracion: receta.duracion || "",
          cantidad: receta.cantidad || "",
        })),
        consulta: {
          fecha: consulta.fecha_atencion,
          tratamiento: consulta.informacion_consulta?.tratamiento || "",
        },
      };

      generarRecetaPDF(datosPDF);
      mostrarNotificacion("Receta generada exitosamente", "success");
    } catch (error) {
      console.error("Error al generar receta:", error);
      mostrarNotificacion("Error al generar la receta", "error");
    }
  };

  const mostrarNotificacion = (mensaje, tipo) => {
    setNotificacion({ show: true, mensaje, tipo });
    setTimeout(() => {
      setNotificacion({ show: false, mensaje: "", tipo: "" });
    }, 3000);
  };

  // Filtrar pacientes por búsqueda
  const pacientesFiltrados = pacientes.filter(
    (p) =>
      p.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rut.includes(searchTerm)
  );

  // Paginación
  const indiceUltimo = paginaActual * pacientesPorPagina;
  const indicePrimero = indiceUltimo - pacientesPorPagina;
  const pacientesPaginados = pacientesFiltrados.slice(
    indicePrimero,
    indiceUltimo
  );
  const totalPaginas = Math.ceil(
    pacientesFiltrados.length / pacientesPorPagina
  );

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  return (
    <div className="space-y-6">
      {/* Notificación */}
      <AnimatePresence>
        {notificacion.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
              notificacion.tipo === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <p className="font-semibold">{notificacion.mensaje}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Historia Médica
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Consulta el historial médico completo de tus pacientes atendidos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Pacientes */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Mis Pacientes
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre o RUT..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPaginaActual(1);
                  }}
                  className="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Total: {pacientesFiltrados.length} paciente
                {pacientesFiltrados.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Loading state */}
            {loadingPacientes ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-4">
                  Cargando pacientes...
                </p>
              </div>
            ) : pacientesPaginados.length === 0 ? (
              <div className="p-12 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchTerm
                    ? "No se encontraron pacientes"
                    : "No hay pacientes atendidos"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm
                    ? "Intenta con otro término de búsqueda"
                    : "Los pacientes con consultas completadas aparecerán aquí"}
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                  {pacientesPaginados.map((paciente) => (
                    <button
                      key={paciente.id}
                      onClick={() => handleSeleccionarPaciente(paciente)}
                      className={`w-full text-left p-4 rounded-lg transition-all ${
                        selectedPaciente?.id === paciente.id
                          ? "bg-green-500 text-white shadow-lg"
                          : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                      }`}
                    >
                      <h3 className="font-semibold">
                        {paciente.nombre_completo}
                      </h3>
                      <p
                        className={`text-sm ${
                          selectedPaciente?.id === paciente.id
                            ? "text-green-100"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        RUT: {paciente.rut || "N/A"}
                        {paciente.edad && ` • ${paciente.edad} años`}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          selectedPaciente?.id === paciente.id
                            ? "text-green-200"
                            : "text-gray-500 dark:text-gray-500"
                        }`}
                      >
                        Última atención:{" "}
                        {new Date(paciente.ultima_atencion).toLocaleDateString(
                          "es-ES"
                        )}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => cambiarPagina(paginaActual - 1)}
                        disabled={paginaActual === 1}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          paginaActual === 1
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        Anterior
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Página {paginaActual} de {totalPaginas}
                      </span>
                      <button
                        onClick={() => cambiarPagina(paginaActual + 1)}
                        disabled={paginaActual === totalPaginas}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          paginaActual === totalPaginas
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Historial Médico */}
        <div className="lg:col-span-2">
          {!selectedPaciente ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <svg
                className="w-20 h-20 mx-auto text-gray-400 dark:text-gray-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Selecciona un paciente
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Selecciona un paciente de la lista para ver su historia médica
                completa
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              {/* Patient Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-500 to-green-600">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-green-600 text-2xl font-bold">
                    {selectedPaciente.nombre_completo
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)}
                  </div>
                  <div className="text-white">
                    <h2 className="text-2xl font-bold">
                      {selectedPaciente.nombre_completo}
                    </h2>
                    <p className="text-green-100">
                      RUT: {selectedPaciente.rut || "N/A"}
                      {selectedPaciente.edad &&
                        ` • ${selectedPaciente.edad} años`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Consultas */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Consultas Completadas
                  </h3>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm font-medium">
                    {historialConsultas.length} consulta
                    {historialConsultas.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {loadingHistorial ? (
                  <div className="py-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-400 mt-4">
                      Cargando historial...
                    </p>
                  </div>
                ) : historialConsultas.length === 0 ? (
                  <div className="py-12 text-center">
                    <svg
                      className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400">
                      No hay consultas completadas registradas
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historialConsultas.map((consulta) => (
                      <div
                        key={consulta.cita_id}
                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                        onClick={() => handleVerConsulta(consulta)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {consulta.informacion_consulta
                                  ?.motivo_consulta || "Consulta general"}
                              </h4>
                              {consulta.recetas &&
                                consulta.recetas.length > 0 && (
                                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs font-medium">
                                    Con receta
                                  </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(
                                consulta.fecha_atencion
                              ).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                              Dr. {consulta.doctor?.nombre}{" "}
                              {consulta.doctor?.apellido_paterno}
                              {consulta.especialidad &&
                                ` • ${consulta.especialidad.nombre}`}
                            </p>
                          </div>
                          <button className="text-green-600 hover:text-green-700 dark:text-green-400 flex-shrink-0">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </div>
                        {consulta.informacion_consulta?.diagnostico && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded">
                            <span className="font-medium">Diagnóstico:</span>{" "}
                            {
                              consulta.informacion_consulta.diagnostico
                                .nombre_enfermedad
                            }
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle de Consulta */}
      <AnimatePresence>
        {showConsultaModal && selectedConsulta && (
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-500 to-green-600 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <h2 className="text-2xl font-bold">
                      {selectedConsulta.informacion_consulta?.motivo_consulta ||
                        "Detalle de Consulta"}
                    </h2>
                    <p className="text-green-100">
                      {new Date(
                        selectedConsulta.fecha_atencion
                      ).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConsultaModal(false)}
                    className="text-white hover:text-green-100 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Información del Doctor */}
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <svg
                    className="w-8 h-8 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Atendido por
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Dr. {selectedConsulta.doctor?.nombre}{" "}
                      {selectedConsulta.doctor?.apellido_paterno}{" "}
                      {selectedConsulta.doctor?.apellido_materno}
                    </p>
                    {selectedConsulta.especialidad && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedConsulta.especialidad.nombre}
                      </p>
                    )}
                  </div>
                </div>

                {/* Motivo de Consulta */}
                {selectedConsulta.informacion_consulta?.motivo_consulta && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Motivo de Consulta
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      {selectedConsulta.informacion_consulta.motivo_consulta}
                    </p>
                  </div>
                )}

                {/* Antecedentes */}
                {selectedConsulta.informacion_consulta?.antecedentes && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Antecedentes
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      {selectedConsulta.informacion_consulta.antecedentes}
                    </p>
                  </div>
                )}

                {/* Síntomas */}
                {selectedConsulta.informacion_consulta?.dolores_sintomas && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Síntomas y Dolores
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      {selectedConsulta.informacion_consulta.dolores_sintomas}
                    </p>
                  </div>
                )}

                {/* Atenciones Quirúrgicas */}
                {selectedConsulta.informacion_consulta
                  ?.atenciones_quirurgicas && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      Atenciones Quirúrgicas
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      {
                        selectedConsulta.informacion_consulta
                          .atenciones_quirurgicas
                      }
                    </p>
                  </div>
                )}

                {/* Evaluación del Doctor */}
                {selectedConsulta.informacion_consulta?.evaluacion_doctor && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      Evaluación del Doctor
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      {selectedConsulta.informacion_consulta.evaluacion_doctor}
                    </p>
                  </div>
                )}

                {/* Diagnóstico */}
                {selectedConsulta.informacion_consulta?.diagnostico && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Diagnóstico
                    </h3>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {
                          selectedConsulta.informacion_consulta.diagnostico
                            .nombre_enfermedad
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Tratamiento */}
                {selectedConsulta.informacion_consulta?.tratamiento && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                      </svg>
                      Tratamiento
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      {selectedConsulta.informacion_consulta.tratamiento}
                    </p>
                  </div>
                )}

                {/* Recetas */}
                {selectedConsulta.recetas &&
                  selectedConsulta.recetas.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Receta Médica
                        </h3>
                        <button
                          onClick={() => handleGenerarReceta(selectedConsulta)}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                            />
                          </svg>
                          Imprimir Receta
                        </button>
                      </div>
                      <div className="space-y-3">
                        {selectedConsulta.recetas.map((receta, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                          >
                            <p className="font-semibold text-gray-900 dark:text-white mb-2">
                              {receta.nombre}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              {receta.presentacion && (
                                <div>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    Presentación
                                  </p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {receta.presentacion}
                                  </p>
                                </div>
                              )}
                              {receta.dosis && (
                                <div>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    Dosis
                                  </p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {receta.dosis}
                                  </p>
                                </div>
                              )}
                              {receta.duracion && (
                                <div>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    Duración
                                  </p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {receta.duracion}
                                  </p>
                                </div>
                              )}
                              {receta.cantidad && (
                                <div>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    Cantidad
                                  </p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {receta.cantidad}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Botones de acción */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowConsultaModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-semibold"
                  >
                    Cerrar
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
