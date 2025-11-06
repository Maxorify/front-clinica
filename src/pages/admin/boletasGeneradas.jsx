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

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
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
              <h1 className="text-3xl font-bold">Boletas Generadas</h1>
              <p className="text-indigo-100 mt-2 text-sm">
                Consulta y regenera boletas de pagos procesados
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                  <span className="text-sm font-semibold">
                    {pagosFiltrados.length}
                  </span>
                  <span className="text-xs ml-1">boletas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaDesde: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaHasta: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
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
                  placeholder="Paciente, RUT, Doctor, N° Boleta..."
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de pagos */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-500"></div>
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
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
              Cargando boletas...
            </p>
          </div>
        ) : pagosFiltrados.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-16 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="inline-flex p-5 bg-white dark:bg-gray-800 rounded-full shadow-lg mb-6">
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
              No hay boletas
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No se encontraron boletas con los filtros aplicados
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {pagosFiltrados.map((pago, index) => (
              <motion.div
                key={pago.pago.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 overflow-hidden"
              >
                <div className="h-1.5 bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600"></div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Número de Boleta */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
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
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
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
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                          <svg
                            className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                            Paciente
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white truncate">
                            {pago.paciente.nombre}{" "}
                            {pago.paciente.apellido_paterno}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {pago.paciente.rut}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Doctor y Especialidad */}
                    <div className="lg:col-span-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                          <svg
                            className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
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
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                            Doctor
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white truncate">
                            Dr. {pago.doctor.nombre}{" "}
                            {pago.doctor.apellido_paterno}
                          </p>
                          <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
                            {pago.especialidad?.nombre || "Sin especialidad"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fecha y Monto */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors">
                          <svg
                            className="w-6 h-6 text-amber-600 dark:text-amber-400"
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
                          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
                            Monto
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white text-lg">
                            {formatearMoneda(pago.pago.total)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatearFecha(pago.pago.fecha_pago)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botón */}
                    <div className="lg:col-span-2 flex items-center justify-end">
                      <button
                        onClick={() => regenerarBoleta(pago)}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl transition-all font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
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
                        Generar Boleta
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
