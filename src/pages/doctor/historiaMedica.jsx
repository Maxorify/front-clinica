import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { generarRecetaPDF } from "../../utils/generarRecetaPDF";

export default function HistoriaMedica() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [selectedConsulta, setSelectedConsulta] = useState(null);
  const [showConsultaDetalle, setShowConsultaDetalle] = useState(false);

  // Estados para los datos del backend
  const [pacientes, setPacientes] = useState([]);
  const [historialConsultas, setHistorialConsultas] = useState([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const pacientesPorPagina = 6;

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
    setShowConsultaDetalle(true);
  };

  const handleVolverALista = () => {
    setShowConsultaDetalle(false);
    setSelectedConsulta(null);
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

      // Preparar datos para el PDF
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

  // Helper para generar iniciales
  const getIniciales = (nombre) => {
    return nombre
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Notificación Toast */}
      <AnimatePresence>
        {notificacion.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 max-w-md"
          >
            <div
              className={`px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-sm ${
                notificacion.tipo === "success"
                  ? "bg-emerald-500/95 border-emerald-400 text-white"
                  : "bg-red-500/95 border-red-400 text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                {notificacion.tipo === "success" ? (
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <p className="font-semibold">{notificacion.mensaje}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Superior */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Historial Médico
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Consulta el registro clínico completo de tus pacientes
            </p>
          </div>
        </div>
      </motion.div>

      {/* Layout Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[calc(100vh-20rem)]">
        {/* Panel Izquierdo - Lista de Pacientes */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-4 h-full"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col">
            {/* Header del Panel */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Mis Pacientes
              </h2>

              {/* Buscador */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre o RUT..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPaginaActual(1);
                  }}
                  className="w-full px-4 py-3 pl-11 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/60 transition-all"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <p className="text-white/80 text-sm mt-3">
                {pacientesFiltrados.length} paciente{pacientesFiltrados.length !== 1 ? "s" : ""} encontrado{pacientesFiltrados.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Lista de Pacientes */}
            <div className="p-4 flex-1 flex flex-col overflow-hidden">
              {loadingPacientes ? (
                <div className="py-16 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4 font-medium">Cargando pacientes...</p>
                </div>
              ) : pacientesPaginados.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {searchTerm ? "Sin resultados" : "Sin pacientes"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {searchTerm
                      ? "Intenta con otro término de búsqueda"
                      : "Los pacientes atendidos aparecerán aquí"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    {pacientesPaginados.map((paciente, index) => (
                      <motion.button
                        key={paciente.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSeleccionarPaciente(paciente)}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-200 group ${
                          selectedPaciente?.id === paciente.id
                            ? "bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30 scale-[1.02]"
                            : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${
                              selectedPaciente?.id === paciente.id
                                ? "bg-white/20 text-white"
                                : "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md"
                            }`}
                          >
                            {getIniciales(paciente.nombre_completo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`font-semibold truncate ${
                                selectedPaciente?.id === paciente.id
                                  ? "text-white"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {paciente.nombre_completo}
                            </h3>
                            <p
                              className={`text-sm truncate ${
                                selectedPaciente?.id === paciente.id
                                  ? "text-purple-100"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              RUT: {paciente.rut || "N/A"}
                              {paciente.edad && ` • ${paciente.edad} años`}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                selectedPaciente?.id === paciente.id
                                  ? "text-purple-200"
                                  : "text-gray-500 dark:text-gray-500"
                              }`}
                            >
                              Última: {new Date(paciente.ultima_atencion).toLocaleDateString("es-ES")}
                            </p>
                          </div>
                          <svg
                            className={`w-5 h-5 flex-shrink-0 transition-transform ${
                              selectedPaciente?.id === paciente.id
                                ? "text-white rotate-0"
                                : "text-gray-400 -rotate-90 group-hover:rotate-0"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Paginación */}
                  {totalPaginas > 1 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => cambiarPagina(paginaActual - 1)}
                          disabled={paginaActual === 1}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            paginaActual === 1
                              ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                              : "bg-purple-500 text-white hover:bg-purple-600 hover:shadow-md active:scale-95"
                          }`}
                        >
                          Anterior
                        </button>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {paginaActual} / {totalPaginas}
                        </span>
                        <button
                          onClick={() => cambiarPagina(paginaActual + 1)}
                          disabled={paginaActual === totalPaginas}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            paginaActual === totalPaginas
                              ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                              : "bg-purple-500 text-white hover:bg-purple-600 hover:shadow-md active:scale-95"
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
        </motion.div>

        {/* Panel Derecho - Historial del Paciente */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-8 h-full"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
            <div className="relative h-full overflow-hidden">
              {/* Vista de Lista de Consultas */}
              <motion.div
                initial={false}
                animate={{
                  x: showConsultaDetalle ? "-100%" : "0%",
                  opacity: showConsultaDetalle ? 0 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                className="absolute inset-0 w-full"
              >
                {!selectedPaciente ? (
                  <div className="p-12 lg:p-20 text-center h-full flex items-center justify-center">
                    <div>
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        Selecciona un paciente
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Elige un paciente de la lista para visualizar su historial médico completo y registros clínicos
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Cabecera del Paciente */}
                    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-violet-600 p-6 lg:p-8">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                          {getIniciales(selectedPaciente.nombre_completo)}
                        </div>
                        <div className="flex-1">
                          <h2 className="text-3xl font-bold text-white mb-2">
                            {selectedPaciente.nombre_completo}
                          </h2>
                          <div className="flex flex-wrap items-center gap-3 text-blue-100">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                              </svg>
                              {selectedPaciente.rut || "N/A"}
                            </span>
                            {selectedPaciente.edad && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {selectedPaciente.edad} años
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contenido del Historial */}
              <div className="p-6 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Consultas Registradas
                  </h3>
                  <span className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full text-sm font-bold shadow-md">
                    {historialConsultas.length} consulta{historialConsultas.length !== 1 ? "s" : ""}
                  </span>
                </div>                      {loadingHistorial ? (
                        <div className="py-20 text-center">
                          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                          <p className="text-gray-600 dark:text-gray-400 mt-4 font-medium">Cargando historial médico...</p>
                        </div>
                      ) : historialConsultas.length === 0 ? (
                        <div className="py-20 text-center">
                          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-lg">
                            No hay consultas registradas para este paciente
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                          {historialConsultas.map((consulta, index) => (
                            <motion.div
                              key={consulta.cita_id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleVerConsulta(consulta)}
                        className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                                {consulta.informacion_consulta?.motivo_consulta || "Consulta general"}
                              </h4>
                              {consulta.recetas && consulta.recetas.length > 0 && (
                                <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold">
                                  Con receta
                                </span>
                              )}
                            </div>                                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {new Date(consulta.fecha_atencion).toLocaleDateString("es-ES", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      Dr. {consulta.doctor?.nombre} {consulta.doctor?.apellido_paterno}
                                    </span>
                                    {consulta.especialidad && (
                                      <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        {consulta.especialidad.nombre}
                                      </span>
                                    )}
                                  </div>

                                  {consulta.informacion_consulta?.diagnostico && (
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                      <p className="text-sm">
                                        <span className="font-semibold text-gray-900 dark:text-white">Diagnóstico:</span>{" "}
                                        <span className="text-gray-700 dark:text-gray-300">
                                          {consulta.informacion_consulta.diagnostico.nombre_enfermedad}
                                        </span>
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <button className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-all">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>

              {/* Vista de Detalle de Consulta - Se desliza desde la derecha */}
              <motion.div
                initial={false}
                animate={{
                  x: showConsultaDetalle ? "0%" : "100%",
                  opacity: showConsultaDetalle ? 1 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                className="absolute inset-0 w-full bg-white dark:bg-gray-800"
              >
                {selectedConsulta && (
                  <div className="h-full flex flex-col">
                    {/* Header del Detalle */}
                    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-violet-600 p-6 flex-shrink-0">
                      <div className="flex items-center gap-4 mb-4">
                        <button
                          onClick={handleVolverALista}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-95"
                        >
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <div className="flex-1">
                          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                            {selectedConsulta.informacion_consulta?.motivo_consulta || "Detalle de Consulta"}
                          </h2>
                          <p className="text-blue-100">
                            {new Date(selectedConsulta.fecha_atencion).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contenido Scrollable del Detalle */}
                    <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                      {/* Información del Doctor */}
                      <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="p-3 bg-blue-500 rounded-xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Atendido por</p>
                          <p className="font-bold text-gray-900 dark:text-white text-lg">
                            Dr. {selectedConsulta.doctor?.nombre} {selectedConsulta.doctor?.apellido_paterno} {selectedConsulta.doctor?.apellido_materno}
                          </p>
                          {selectedConsulta.especialidad && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedConsulta.especialidad.nombre}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Secciones de Información */}
                      {selectedConsulta.informacion_consulta?.motivo_consulta && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Motivo de Consulta
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            {selectedConsulta.informacion_consulta.motivo_consulta}
                          </p>
                        </div>
                      )}

                      {selectedConsulta.informacion_consulta?.antecedentes && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Antecedentes
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            {selectedConsulta.informacion_consulta.antecedentes}
                          </p>
                        </div>
                      )}

                      {selectedConsulta.informacion_consulta?.dolores_sintomas && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Síntomas y Dolores
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            {selectedConsulta.informacion_consulta.dolores_sintomas}
                          </p>
                        </div>
                      )}

                      {selectedConsulta.informacion_consulta?.atenciones_quirurgicas && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Atenciones Quirúrgicas
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            {selectedConsulta.informacion_consulta.atenciones_quirurgicas}
                          </p>
                        </div>
                      )}

                      {selectedConsulta.informacion_consulta?.evaluacion_doctor && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Evaluación del Doctor
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            {selectedConsulta.informacion_consulta.evaluacion_doctor}
                          </p>
                        </div>
                      )}

                      {selectedConsulta.informacion_consulta?.diagnostico && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Diagnóstico
                          </h3>
                          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-5 rounded-xl border-l-4 border-emerald-500">
                            <p className="font-bold text-gray-900 dark:text-white text-lg">
                              {selectedConsulta.informacion_consulta.diagnostico.nombre_enfermedad}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedConsulta.informacion_consulta?.tratamiento && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Tratamiento
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            {selectedConsulta.informacion_consulta.tratamiento}
                          </p>
                        </div>
                      )}

                      {selectedConsulta.recetas && selectedConsulta.recetas.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Receta Médica
                            </h3>
                            <button
                              onClick={() => handleGenerarReceta(selectedConsulta)}
                              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              Imprimir Receta
                            </button>
                          </div>
                          <div className="space-y-3">
                            {selectedConsulta.recetas.map((receta, idx) => (
                              <div
                                key={idx}
                                className="p-5 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                              >
                                <p className="font-bold text-gray-900 dark:text-white text-lg mb-3">
                                  {receta.nombre}
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {receta.presentacion && (
                                    <div>
                                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Presentación</p>
                                      <p className="font-semibold text-gray-900 dark:text-white">{receta.presentacion}</p>
                                    </div>
                                  )}
                                  {receta.dosis && (
                                    <div>
                                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Dosis</p>
                                      <p className="font-semibold text-gray-900 dark:text-white">{receta.dosis}</p>
                                    </div>
                                  )}
                                  {receta.duracion && (
                                    <div>
                                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Duración</p>
                                      <p className="font-semibold text-gray-900 dark:text-white">{receta.duracion}</p>
                                    </div>
                                  )}
                                  {receta.cantidad && (
                                    <div>
                                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Cantidad</p>
                                      <p className="font-semibold text-gray-900 dark:text-white">{receta.cantidad}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>


      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}
