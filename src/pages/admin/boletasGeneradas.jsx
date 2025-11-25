import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { generarBoletaPDF } from "../../utils/generarBoletaPDF";

const API_URL = "http://localhost:5000";

export default function BoletasGeneradas() {
  const [pagos, setPagos] = useState([]);
  const [pagosFiltrados, setPagosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [filtros, setFiltros] = useState({
    fechaDesde: "",
    fechaHasta: "",
    busqueda: "",
  });

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [boletasPorPagina, setBoletasPorPagina] = useState(5);

  // Calcular índices para paginación
  const indexUltimo = paginaActual * boletasPorPagina;
  const indexPrimero = indexUltimo - boletasPorPagina;
  const boletasActuales = pagosFiltrados.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(pagosFiltrados.length / boletasPorPagina);

  useEffect(() => {
    cargarPagos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, pagos]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const showNotification = (type, message) => {
    setNotification({ id: Date.now(), type, message });
  };

  const cargarPagos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/Citas/listar-pagos`);
      setPagos(response.data.pagos || []);
      setPagosFiltrados(response.data.pagos || []);
    } catch (error) {
      console.error("Error al cargar pagos:", error);
      showNotification("error", "Error al cargar las boletas");
      setPagos([]);
      setPagosFiltrados([]);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...pagos];

    // Filtrar por fecha desde
    if (filtros.fechaDesde) {
      resultado = resultado.filter(
        (pago) =>
          new Date(pago.pago.fecha_pago) >=
          new Date(filtros.fechaDesde + "T00:00:00")
      );
    }

    // Filtrar por fecha hasta
    if (filtros.fechaHasta) {
      resultado = resultado.filter(
        (pago) =>
          new Date(pago.pago.fecha_pago) <=
          new Date(filtros.fechaHasta + "T23:59:59")
      );
    }

    // Filtrar por búsqueda (nombre paciente, RUT, doctor)
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      resultado = resultado.filter((pago) => {
        const nombrePaciente =
          `${pago.paciente.nombre} ${pago.paciente.apellido_paterno}`.toLowerCase();
        const rutPaciente = pago.paciente.rut?.toLowerCase() || "";
        const nombreDoctor =
          `${pago.doctor.nombre} ${pago.doctor.apellido_paterno}`.toLowerCase();

        return (
          nombrePaciente.includes(busqueda) ||
          rutPaciente.includes(busqueda) ||
          nombreDoctor.includes(busqueda) ||
          pago.pago.id.toString().includes(busqueda)
        );
      });
    }

    setPagosFiltrados(resultado);
    setPaginaActual(1); // Reset a primera página cuando se aplican filtros
  };

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cambiarBoletasPorPagina = (cantidad) => {
    setBoletasPorPagina(cantidad);
    setPaginaActual(1);
  };

  const regenerarBoleta = async (pago) => {
    try {
      showNotification("success", "Generando boleta...");

      await generarBoletaPDF({
        datoPago: pago,
        cita: {
          id: pago.cita_id,
          paciente: pago.paciente,
          doctor: pago.doctor,
          fecha_atencion: pago.fecha_atencion,
          especialidad: pago.especialidad,
        },
      });

      showNotification("success", "Boleta regenerada exitosamente");
    } catch (error) {
      console.error("Error al regenerar boleta:", error);
      showNotification("error", "Error al regenerar la boleta");
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatearMoneda = (monto) => {
    return `$${new Intl.NumberFormat("es-CL").format(monto)}`;
  };

  return (
    <>
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 right-6 z-50"
          >
            <div
              className={`max-w-sm rounded-xl border shadow-2xl px-4 py-3 backdrop-blur bg-white/90 dark:bg-gray-900/90 ${
                notification.type === "success"
                  ? "border-emerald-500"
                  : "border-red-500"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full ${
                    notification.type === "success"
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100"
                      : "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100"
                  }`}
                >
                  {notification.type === "success" ? (
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v4m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z"
                      />
                    </svg>
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {notification.type === "success"
                      ? "Acción completada"
                      : "Ocurrió un problema"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {notification.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotification(null)}
                  className="ml-3 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
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
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-50 dark:from-gray-900 dark:via-indigo-950/20 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full -ml-24 -mb-24"></div>

              <div className="relative flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl ring-2 ring-white/30 shadow-lg">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                    Boletas Generadas
                  </h1>
                  <p className="text-indigo-100 text-sm leading-relaxed max-w-2xl">
                    Consulta, filtra y regenera boletas de pagos procesados
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <div className="px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg ring-1 ring-white/30 shadow-md">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold">
                          {pagosFiltrados.length}
                        </span>
                        <span className="text-xs font-medium text-indigo-100">
                          totales
                        </span>
                      </div>
                    </div>
                    <div className="px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold">
                          {boletasActuales.length}
                        </span>
                        <span className="text-xs font-medium text-indigo-100">
                          mostrando
                        </span>
                      </div>
                    </div>
                    {filtros.busqueda ||
                    filtros.fechaDesde ||
                    filtros.fechaHasta ? (
                      <div className="px-3 py-1.5 bg-amber-500/20 backdrop-blur-sm rounded-lg border border-amber-300/30">
                        <span className="text-xs font-medium">
                          Filtros activos
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Filtros */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg p-5 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <svg
                    className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Filtros
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Fecha Desde
                    </span>
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaDesde}
                    onChange={(e) =>
                      setFiltros({ ...filtros, fechaDesde: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Fecha Hasta
                    </span>
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaHasta}
                    onChange={(e) =>
                      setFiltros({ ...filtros, fechaHasta: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white text-sm transition-all"
                  />
                </div>
                <div className="md:col-span-2 xl:col-span-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5"
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
                      Buscar
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={filtros.busqueda}
                      onChange={(e) =>
                        setFiltros({ ...filtros, busqueda: e.target.value })
                      }
                      placeholder="Paciente, RUT, Doctor..."
                      className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Control de Paginación y Cantidad */}
            {!loading && pagosFiltrados.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Selector de cantidad */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      Por página:
                    </label>
                    <div className="flex gap-1.5">
                      {[5, 10, 20, 50].map((cantidad) => (
                        <button
                          key={cantidad}
                          onClick={() => cambiarBoletasPorPagina(cantidad)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all transform hover:scale-105 ${
                            boletasPorPagina === cantidad
                              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md ring-1 ring-indigo-300 dark:ring-indigo-700"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          {cantidad}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info de página */}
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {indexPrimero + 1}
                    </span>
                    {" - "}
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.min(indexUltimo, pagosFiltrados.length)}
                    </span>
                    {" de "}
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {pagosFiltrados.length}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Lista de pagos */}
            {loading ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col justify-center items-center h-64 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-500"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-indigo-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 font-bold text-base">
                  Cargando boletas...
                </p>
              </motion.div>
            ) : pagosFiltrados.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-600"
              >
                <div className="inline-flex p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6 ring-2 ring-gray-200 dark:ring-gray-700">
                  <svg
                    className="w-16 h-16 text-gray-400"
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
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No hay boletas disponibles
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                  {filtros.busqueda || filtros.fechaDesde || filtros.fechaHasta
                    ? "No se encontraron boletas con los filtros aplicados. Intenta ajustar tus criterios de búsqueda."
                    : "Aún no se han generado boletas en el sistema."}
                </p>
              </motion.div>
            ) : (
              <>
                <div className="space-y-6">
                  {boletasActuales.map((pago, index) => (
                    <motion.div
                      key={pago.pago.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-300 overflow-hidden"
                    >
                      <div className="h-1.5 bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-600 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      </div>

                      <div className="p-6 lg:p-7">
                        {/* Mobile Layout */}
                        <div className="lg:hidden space-y-6">
                          {/* Número de Boleta */}
                          <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-xl ring-1 ring-indigo-200 dark:ring-indigo-800 shadow-md">
                                <svg
                                  className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-0.5">
                                  Boleta
                                </p>
                                <p className="font-bold text-gray-900 dark:text-white text-lg">
                                  #{String(pago.pago.id).padStart(8, "0")}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Paciente */}
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl ring-1 ring-blue-200 dark:ring-blue-800 shadow-md">
                              <svg
                                className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                Paciente
                              </p>
                              <p className="font-bold text-gray-900 dark:text-white text-lg">
                                {pago.paciente.nombre}{" "}
                                {pago.paciente.apellido_paterno}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
                                {pago.paciente.rut}
                              </p>
                            </div>
                          </div>

                          {/* Doctor */}
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl ring-1 ring-emerald-200 dark:ring-emerald-800 shadow-md">
                              <svg
                                className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                                Doctor
                              </p>
                              <p className="font-bold text-gray-900 dark:text-white text-base">
                                Dr. {pago.doctor.nombre}{" "}
                                {pago.doctor.apellido_paterno}
                              </p>
                              <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold mt-1">
                                {pago.especialidad?.nombre ||
                                  "Sin especialidad"}
                              </p>
                            </div>
                          </div>

                          {/* Fecha y Monto */}
                          <div className="flex items-start gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="p-2 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl ring-1 ring-amber-200 dark:ring-amber-800 shadow-md">
                              <svg
                                className="w-5 h-5 text-amber-600 dark:text-amber-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
                                Monto
                              </p>
                              <p className="font-bold text-gray-900 dark:text-white text-xl">
                                {formatearMoneda(pago.pago.total)}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {formatearFecha(pago.pago.fecha_pago)}
                              </p>
                            </div>
                          </div>

                          {/* Botón */}
                          <button
                            onClick={() => regenerarBoleta(pago)}
                            className="w-full px-5 py-3 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:via-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                          >
                            <svg
                              className="w-5 h-5"
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
                            <span className="text-sm">Generar PDF</span>
                          </button>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-center">
                          {/* Número de Boleta */}
                          <div className="lg:col-span-2">
                            <div className="flex items-start gap-4">
                              <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-xl ring-1 ring-indigo-200 dark:ring-indigo-800 group-hover:ring-indigo-300 dark:group-hover:ring-indigo-600 shadow-md transition-all">
                                <svg
                                  className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
                                  Boleta
                                </p>
                                <p className="font-bold text-gray-900 dark:text-white text-lg">
                                  #{String(pago.pago.id).padStart(8, "0")}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Paciente */}
                          <div className="lg:col-span-3">
                            <div className="flex items-start gap-4">
                              <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl ring-1 ring-blue-200 dark:ring-blue-800 group-hover:ring-blue-300 dark:group-hover:ring-blue-600 shadow-md transition-all">
                                <svg
                                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5">
                                  Paciente
                                </p>
                                <p className="font-bold text-gray-900 dark:text-white text-base truncate">
                                  {pago.paciente.nombre}{" "}
                                  {pago.paciente.apellido_paterno}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                                  {pago.paciente.rut}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Doctor */}
                          <div className="lg:col-span-3">
                            <div className="flex items-start gap-4">
                              <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl ring-1 ring-emerald-200 dark:ring-emerald-800 group-hover:ring-emerald-300 dark:group-hover:ring-emerald-600 shadow-lg transition-all">
                                <svg
                                  className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                                  Doctor
                                </p>
                                <p className="font-bold text-gray-900 dark:text-white text-base truncate">
                                  Dr. {pago.doctor.nombre}{" "}
                                  {pago.doctor.apellido_paterno}
                                </p>
                                <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                                  {pago.especialidad?.nombre ||
                                    "Sin especialidad"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Fecha y Monto */}
                          <div className="lg:col-span-2">
                            <div className="flex items-start gap-4">
                              <div className="p-2.5 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl ring-1 ring-amber-200 dark:ring-amber-800 group-hover:ring-amber-300 dark:group-hover:ring-amber-600 shadow-lg transition-all">
                                <svg
                                  className="w-5 h-5 text-amber-600 dark:text-amber-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
                                  Monto
                                </p>
                                <p className="font-bold text-gray-900 dark:text-white text-lg">
                                  {formatearMoneda(pago.pago.total)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {formatearFecha(pago.pago.fecha_pago)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Botón */}
                          <div className="lg:col-span-2 flex items-center justify-end">
                            <button
                              onClick={() => regenerarBoleta(pago)}
                              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:via-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap"
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
                              <span className="text-xs">Generar PDF</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-xl p-6 lg:p-8 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      {/* Info y navegación rápida */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => cambiarPagina(1)}
                          disabled={paginaActual === 1}
                          className={`p-2.5 rounded-lg font-bold transition-all transform hover:scale-110 ${
                            paginaActual === 1
                              ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl"
                          }`}
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
                              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                            />
                          </svg>
                        </button>

                        <button
                          onClick={() => cambiarPagina(paginaActual - 1)}
                          disabled={paginaActual === 1}
                          className={`p-2.5 rounded-lg font-bold transition-all transform hover:scale-110 ${
                            paginaActual === 1
                              ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl"
                          }`}
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
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Números de página */}
                      <div className="flex items-center gap-2.5 flex-wrap justify-center">
                        {Array.from(
                          { length: Math.min(totalPaginas, 7) },
                          (_, i) => {
                            let pageNumber;
                            if (totalPaginas <= 7) {
                              pageNumber = i + 1;
                            } else if (paginaActual <= 4) {
                              pageNumber = i + 1;
                            } else if (paginaActual >= totalPaginas - 3) {
                              pageNumber = totalPaginas - 6 + i;
                            } else {
                              pageNumber = paginaActual - 3 + i;
                            }

                            return (
                              <button
                                key={pageNumber}
                                onClick={() => cambiarPagina(pageNumber)}
                                className={`min-w-[40px] h-10 rounded-lg font-bold transition-all transform hover:scale-110 text-sm ${
                                  paginaActual === pageNumber
                                    ? "bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-xl ring-2 ring-indigo-200 dark:ring-indigo-800 scale-110"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-md"
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          }
                        )}
                      </div>

                      {/* Navegación adelante */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => cambiarPagina(paginaActual + 1)}
                          disabled={paginaActual === totalPaginas}
                          className={`p-2.5 rounded-lg font-bold transition-all transform hover:scale-110 ${
                            paginaActual === totalPaginas
                              ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl"
                          }`}
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>

                        <button
                          onClick={() => cambiarPagina(totalPaginas)}
                          disabled={paginaActual === totalPaginas}
                          className={`p-2.5 rounded-lg font-bold transition-all transform hover:scale-110 ${
                            paginaActual === totalPaginas
                              ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl"
                          }`}
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
                              d="M13 5l7 7-7 7M5 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Info adicional */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Página{" "}
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {paginaActual}
                        </span>{" "}
                        de{" "}
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {totalPaginas}
                        </span>
                      </p>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
