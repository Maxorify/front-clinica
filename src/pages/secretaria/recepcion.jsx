import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { generarBoletaPDF } from "../../utils/generarBoletaPDF";
import {
  formatTime,
  formatDate,
  formatDateTime,
  parseUTCDate,
} from "../../utils/dateUtils";

const API_URL = "http://localhost:5000";

// Función de fetch para React Query
const fetchCitas = async (fechaFiltro) => {
  const { data } = await axios.get(`${API_URL}/Citas/listar-citas`, {
    params: {
      fecha: fechaFiltro,
      estado: "Pendiente",
    },
  });
  return data.citas || [];
};

export default function Recepcion() {
  const queryClient = useQueryClient();
  // Obtener fecha actual en timezone de Chile
  const [fechaFiltro, setFechaFiltro] = useState(
    new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Santiago",
    })
  );
  const [showModalPago, setShowModalPago] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loadingPago, setLoadingPago] = useState(false);

  const [formPago, setFormPago] = useState({
    tipo_pago: "Efectivo",
    monto_base: 0,
    descuento_aseguradora: 0,
    detalle_descuento: "",
    habilitar_descuento: false,
  });

  // React Query - Caché inteligente
  const { data: citas = [], isLoading: loading } = useQuery({
    queryKey: ["citas", fechaFiltro],
    queryFn: () => fetchCitas(fechaFiltro),
    staleTime: 30 * 1000, // 30 segundos
  });

  const [citasFiltradas, setCitasFiltradas] = useState([]);

  useEffect(() => {
    setCitasFiltradas(citas);
  }, [citas]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const showNotification = (type, message) => {
    setNotification({ id: Date.now(), type, message });
  };

  const actualizarCitas = async () => {
    // Refetch fuerza recarga inmediata sin usar cache
    await queryClient.refetchQueries({ queryKey: ["citas", fechaFiltro] });
  };

  const abrirModalPago = async (cita) => {
    try {
      // La cita ya trae la especialidad y el precio desde el backend
      const especialidadId = cita.especialidad?.id;
      const precio = cita.precio_especialidad || 0;

      if (!especialidadId) {
        showNotification(
          "error",
          "Esta cita no tiene una especialidad asignada"
        );
        return;
      }

      if (!precio || precio === 0) {
        showNotification(
          "error",
          "Esta especialidad no tiene un precio asignado. Por favor, configure el precio en la sección de Especialidades."
        );
        return;
      }

      console.log("🔍 DEBUG - Especialidad:", cita.especialidad);
      console.log("🔍 DEBUG - Precio obtenido:", precio);

      setCitaSeleccionada({ ...cita, especialidad_id: especialidadId });
      setFormPago({
        tipo_pago: "Efectivo",
        monto_base: precio,
        descuento_aseguradora: 0,
        detalle_descuento: "",
        habilitar_descuento: false,
      });
      setShowModalPago(true);
    } catch (error) {
      console.error("Error al abrir modal de pago:", error);
      showNotification("error", "Error al procesar la información de pago");
    }
  };

  const cerrarModalPago = () => {
    setShowModalPago(false);
    setCitaSeleccionada(null);
    setFormPago({
      tipo_pago: "Efectivo",
      monto_base: 0,
      descuento_aseguradora: 0,
      detalle_descuento: "",
      habilitar_descuento: false,
    });
  };

  const calcularMontoFinal = () => {
    if (!formPago.habilitar_descuento || !formPago.descuento_aseguradora) {
      return formPago.monto_base;
    }
    return formPago.monto_base * (1 - formPago.descuento_aseguradora / 100);
  };

  const procesarPago = async (e) => {
    e.preventDefault();
    setLoadingPago(true);

    try {
      const payload = {
        cita_medica_id: citaSeleccionada.id,
        tipo_pago: formPago.tipo_pago,
        total: formPago.monto_base,
        descuento_aseguradora: formPago.habilitar_descuento
          ? formPago.descuento_aseguradora
          : null,
        detalle_descuento: formPago.habilitar_descuento
          ? formPago.detalle_descuento
          : null,
      };

      const response = await axios.post(
        `${API_URL}/Citas/procesar-pago`,
        payload
      );

      showNotification("success", "Pago procesado exitosamente");

      // Generar boleta PDF
      await generarBoletaPDF({
        datoPago: response.data,
        cita: citaSeleccionada,
      });

      // Recargar citas y esperar a que termine
      await actualizarCitas();
      cerrarModalPago();
    } catch (error) {
      console.error("Error al procesar pago:", error);
      showNotification(
        "error",
        error.response?.data?.detail || "Error al procesar el pago"
      );
    } finally {
      setLoadingPago(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString("es-CL", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Santiago",
    });
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

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50 dark:from-gray-900 dark:via-green-950/20 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Recepción de Pacientes
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
                Gestiona los pagos de las consultas médicas del día
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  type="date"
                  value={fechaFiltro}
                  onChange={(e) => setFechaFiltro(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white font-medium"
                />
              </div>
              <button
                onClick={actualizarCitas}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold shadow-sm hover:shadow-md flex items-center justify-center gap-2"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Actualizar
              </button>
            </div>
          </div>

          {/* Stats Badge */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Citas Pendientes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {citasFiltradas.length}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de citas mejorada */}
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-500"
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
                </div>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
                Cargando citas...
              </p>
            </div>
          ) : citasFiltradas.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-16 text-center">
              <div className="inline-flex p-5 bg-gray-50 dark:bg-gray-700 rounded-full mb-6">
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
                No hay citas pendientes
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                No se encontraron consultas para procesar en esta fecha
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {citasFiltradas.map((cita, index) => (
                <motion.div
                  key={cita.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      {/* Paciente */}
                      <div className="lg:col-span-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
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
                            <p className="font-bold text-gray-900 dark:text-white text-lg truncate">
                              {cita.paciente.nombre}{" "}
                              {cita.paciente.apellido_paterno}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                              RUT: {cita.paciente.rut}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Doctor */}
                      <div className="lg:col-span-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
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
                              Dr. {cita.doctor.nombre}{" "}
                              {cita.doctor.apellido_paterno}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Especialidad y Precio */}
                      <div className="lg:col-span-2">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                            <svg
                              className="w-6 h-6 text-purple-600 dark:text-purple-400"
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
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
                              Especialidad
                            </p>
                            <p className="font-bold text-gray-900 dark:text-white truncate">
                              {cita.especialidad?.nombre || "Sin especialidad"}
                            </p>
                            {cita.precio_especialidad && (
                              <div className="flex items-center gap-1 mt-1">
                                <svg
                                  className="w-4 h-4 text-emerald-500"
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
                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                  $
                                  {new Intl.NumberFormat("es-CL").format(
                                    cita.precio_especialidad
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Fecha y Hora */}
                      <div className="lg:col-span-2">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
                              Fecha y Hora
                            </p>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                              {formatearFecha(cita.fecha_atencion)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="lg:col-span-2 flex flex-col items-stretch lg:items-end gap-3">
                        <span className="px-4 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-bold text-center border border-amber-200 dark:border-amber-700">
                          {cita.estado_actual}
                        </span>
                        <button
                          onClick={() => abrirModalPago(cita)}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all font-bold shadow-sm hover:shadow-md flex items-center justify-center gap-2"
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
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          Procesar Pago
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de pago mejorado */}
      <AnimatePresence>
        {showModalPago && citaSeleccionada && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header con gradiente */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

                <div className="relative flex items-start justify-between">
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
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">
                        Procesar Pago de Consulta
                      </h2>
                      <div className="flex items-center gap-2 text-blue-100">
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span className="font-semibold">
                          {citaSeleccionada.paciente.nombre}{" "}
                          {citaSeleccionada.paciente.apellido_paterno}
                        </span>
                      </div>
                      <p className="text-sm text-blue-100 mt-1">
                        RUT: {citaSeleccionada.paciente.rut}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={cerrarModalPago}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
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

              <form
                onSubmit={procesarPago}
                className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]"
              >
                {/* Información de la cita */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
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
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase">
                        Doctor
                      </p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        Dr. {citaSeleccionada.doctor.nombre}{" "}
                        {citaSeleccionada.doctor.apellido_paterno}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <svg
                        className="w-5 h-5 text-purple-600 dark:text-purple-400"
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
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase">
                        Fecha
                      </p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatearFecha(citaSeleccionada.fecha_atencion)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Método de pago */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    Método de Pago
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      "Efectivo",
                      "Tarjeta de Débito",
                      "Tarjeta de Crédito",
                      "Transferencia",
                    ].map((metodo) => (
                      <button
                        key={metodo}
                        type="button"
                        onClick={() =>
                          setFormPago({ ...formPago, tipo_pago: metodo })
                        }
                        className={`p-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                          formPago.tipo_pago === metodo
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-md"
                            : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300"
                        }`}
                      >
                        {metodo}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monto base */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-emerald-600"
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
                    Monto de la Consulta
                  </label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-gray-500 dark:text-gray-400 font-bold">
                      $
                    </span>
                    <input
                      type="text"
                      value={new Intl.NumberFormat("es-CL").format(
                        formPago.monto_base
                      )}
                      disabled
                      className="w-full pl-12 pr-6 py-4 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-bold text-2xl cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Habilitar descuento */}
                <div className="flex items-center gap-4 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  <input
                    type="checkbox"
                    id="habilitar_descuento"
                    checked={formPago.habilitar_descuento}
                    onChange={(e) =>
                      setFormPago({
                        ...formPago,
                        habilitar_descuento: e.target.checked,
                      })
                    }
                    className="w-6 h-6 text-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <label
                    htmlFor="habilitar_descuento"
                    className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                  >
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    Aplicar descuento por aseguradora o convenio
                  </label>
                </div>

                {/* Campos de descuento */}
                <AnimatePresence>
                  {formPago.habilitar_descuento && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                            Porcentaje de Descuento
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={formPago.descuento_aseguradora}
                              onChange={(e) =>
                                setFormPago({
                                  ...formPago,
                                  descuento_aseguradora:
                                    parseFloat(e.target.value) || 0,
                                })
                              }
                              required={formPago.habilitar_descuento}
                              className="w-full pr-12 pl-5 py-3 bg-white dark:bg-gray-700 border-2 border-blue-300 dark:border-blue-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-semibold text-lg"
                              placeholder="0"
                            />
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 font-bold text-xl">
                              %
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                            Descuento Calculado
                          </label>
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-xl border-2 border-blue-300 dark:border-blue-600 w-full">
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-1">
                                Ahorro
                              </p>
                              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                $
                                {new Intl.NumberFormat("es-CL").format(
                                  formPago.monto_base - calcularMontoFinal()
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-blue-600"
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
                          Motivo del Descuento
                          <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formPago.detalle_descuento}
                          onChange={(e) =>
                            setFormPago({
                              ...formPago,
                              detalle_descuento: e.target.value,
                            })
                          }
                          required={formPago.habilitar_descuento}
                          rows="3"
                          placeholder="Ejemplo: Convenio con FONASA, Descuento por Isapre X, Promoción especial, etc."
                          className="w-full px-5 py-3 bg-white dark:bg-gray-700 border-2 border-blue-300 dark:border-blue-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Total a pagar */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-8 text-white shadow-2xl">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                          <svg
                            className="w-7 h-7"
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
                        <p className="text-xl font-bold">Total a Pagar</p>
                      </div>
                      {formPago.habilitar_descuento &&
                        formPago.descuento_aseguradora > 0 && (
                          <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg">
                            <p className="text-sm font-semibold">
                              -{formPago.descuento_aseguradora}% descuento
                            </p>
                          </div>
                        )}
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold opacity-90">$</span>
                      <span className="text-5xl font-black">
                        {new Intl.NumberFormat("es-CL").format(
                          calcularMontoFinal()
                        )}
                      </span>
                    </div>

                    {formPago.habilitar_descuento &&
                      formPago.descuento_aseguradora > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                          <div className="flex items-center justify-between text-sm">
                            <span className="opacity-90">Monto original:</span>
                            <span className="font-semibold line-through opacity-75">
                              $
                              {new Intl.NumberFormat("es-CL").format(
                                formPago.monto_base
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={cerrarModalPago}
                    className="px-8 py-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loadingPago}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                  >
                    {loadingPago ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Confirmar Pago
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
