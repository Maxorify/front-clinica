import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "http://localhost:5000";

// Helper para parsear fechas UTC del backend correctamente
const parseUTCDate = (dateString) => {
  if (!dateString) return null;
  // Si ya termina en Z, usar directamente. Si no, agregarlo
  const dateStr = dateString.endsWith("Z") ? dateString : dateString + "Z";
  return new Date(dateStr);
};

export default function DashboardDoctor() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    citas_hoy: 0,
    atendidos_hoy: 0,
    pendientes_hoy: 0,
    cancelados_hoy: 0,
    total_pacientes_mes: 0,
  });
  const [citasHoy, setCitasHoy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [turnoHoy, setTurnoHoy] = useState(null);
  const [loadingAsistencia, setLoadingAsistencia] = useState(false);
  const [notification, setNotification] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    cargarDatos();
    cargarTurnoHoy();

    const turnoInterval = setInterval(cargarTurnoHoy, 30000);
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(turnoInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const cargarDatos = async () => {
    try {
      const doctorId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");
      const fechaHoy = new Date().toISOString().split("T")[0];

      const statsResponse = await fetch(
        `${API_URL}/Citas/doctor/${doctorId}/stats?fecha=${fechaHoy}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const statsData = await statsResponse.json();
      setStats(statsData);

      const citasResponse = await fetch(
        `${API_URL}/Citas/doctor/${doctorId}/citas?fecha=${fechaHoy}&estados=Pendiente,Confirmada,En Consulta,Completada`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const citasData = await citasResponse.json();
      setCitasHoy(citasData.citas || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarTurnoHoy = async () => {
    try {
      const doctorId = localStorage.getItem("user_id");
      const response = await axios.get(
        `${API_URL}/asistencia/doctor/mi-turno-hoy?usuario_id=${doctorId}`
      );

      // Calcular si está fuera de horario
      const data = response.data;
      if (data.tiene_turno) {
        const ahora = new Date();
        // Convertir fechas UTC del backend a hora local
        const finTurno = parseUTCDate(data.turno_programado.fin);
        const inicioTurno = parseUTCDate(data.turno_programado.inicio);

        data.fuera_de_horario = ahora > finTurno;
        data.esta_atrasado =
          ahora > inicioTurno && !data.asistencia.tiene_entrada;
      }

      setTurnoHoy(data);
    } catch (error) {
      console.error("Error al cargar turno:", error);
      setTurnoHoy({ tiene_turno: false });
    }
  };

  const marcarEntrada = async () => {
    // Validar si está fuera de horario
    if (turnoHoy?.fuera_de_horario) {
      showNotification(
        "error",
        "⏰ Turno finalizado. No puedes marcar entrada después de la hora límite."
      );
      return;
    }

    setLoadingAsistencia(true);
    try {
      const doctorId = localStorage.getItem("user_id");
      await axios.post(
        `${API_URL}/asistencia/doctor/marcar-entrada?usuario_id=${doctorId}`
      );

      if (turnoHoy?.esta_atrasado) {
        showNotification("warning", "⚠️ Entrada registrada con atraso");
      } else {
        showNotification("success", "✓ Entrada registrada exitosamente");
      }

      await cargarTurnoHoy();
    } catch (error) {
      showNotification(
        "error",
        error.response?.data?.detail || "Error al marcar entrada"
      );
    } finally {
      setLoadingAsistencia(false);
    }
  };

  const marcarSalida = async () => {
    if (!confirm("¿Confirmar salida del turno?")) return;
    setLoadingAsistencia(true);
    try {
      const doctorId = localStorage.getItem("user_id");
      const response = await axios.post(
        `${API_URL}/asistencia/doctor/marcar-salida?usuario_id=${doctorId}`
      );
      showNotification(
        "success",
        `✓ Turno finalizado • ${response.data.horas_trabajadas}h trabajadas`
      );
      await cargarTurnoHoy();
    } catch (error) {
      showNotification(
        "error",
        error.response?.data?.detail || "Error al marcar salida"
      );
    } finally {
      setLoadingAsistencia(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const calcularHorasTrabajadas = () => {
    if (!turnoHoy?.asistencia?.hora_entrada) return "0.0";
    // El backend guarda en UTC, convertir a hora local
    const entrada = parseUTCDate(turnoHoy.asistencia.hora_entrada);
    if (!entrada) return "0.0";
    const diff = (currentTime - entrada) / (1000 * 60 * 60);
    return diff.toFixed(1);
  };

  const getEstadoColor = (estado) => {
    const colors = {
      Completada:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
      "En Consulta":
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      Confirmada:
        "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800",
      Pendiente:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    };
    return (
      colors[estado] ||
      "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 max-w-md"
          >
            <div
              className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border ${
                notification.type === "success"
                  ? "bg-emerald-500/95 border-emerald-400 text-white"
                  : "bg-red-500/95 border-red-400 text-white"
              }`}
            >
              <div className="flex-1 font-medium">{notification.message}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Dashboard Médico
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Dr. {localStorage.getItem("user_name")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                {currentTime.toLocaleTimeString("es-CL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {currentTime.toLocaleDateString("es-CL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Attendance Widget - Premium Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {turnoHoy?.tiene_turno ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 shadow-xl">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                    backgroundSize: "32px 32px",
                  }}
                />
              </div>

              <div className="relative p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left: Turno Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
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
                        <h3 className="text-white font-bold text-xl">
                          Mi Turno Actual
                        </h3>
                        <p className="text-blue-100 text-sm">
                          Control de asistencia profesional
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Horario Programado */}
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                        <div className="text-blue-100 text-xs font-medium mb-1">
                          HORARIO
                        </div>
                        <div className="text-white font-bold text-lg">
                          {parseUTCDate(
                            turnoHoy.turno_programado.inicio
                          )?.toLocaleTimeString("es-CL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }) || "---"}
                        </div>
                        <div className="text-blue-100 text-sm">
                          -{" "}
                          {parseUTCDate(
                            turnoHoy.turno_programado.fin
                          )?.toLocaleTimeString("es-CL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }) || "---"}
                        </div>
                      </div>

                      {/* Entrada Real */}
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                        <div className="text-blue-100 text-xs font-medium mb-1">
                          ENTRADA
                        </div>
                        <div className="text-white font-bold text-lg">
                          {turnoHoy.asistencia.hora_entrada
                            ? parseUTCDate(
                                turnoHoy.asistencia.hora_entrada
                              )?.toLocaleTimeString("es-CL", {
                                hour: "2-digit",
                                minute: "2-digit",
                              }) || "---"
                            : "---"}
                        </div>
                        {turnoHoy.asistencia.minutos_atraso > 0 && (
                          <div className="text-amber-300 text-xs font-medium">
                            +{turnoHoy.asistencia.minutos_atraso} min
                          </div>
                        )}
                      </div>

                      {/* Horas Trabajadas */}
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                        <div className="text-blue-100 text-xs font-medium mb-1">
                          TRABAJADAS
                        </div>
                        <div className="text-white font-bold text-2xl tabular-nums">
                          {turnoHoy.asistencia.hora_entrada
                            ? calcularHorasTrabajadas()
                            : "0.0"}
                          <span className="text-base ml-1">h</span>
                        </div>
                      </div>

                      {/* Estado */}
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                        <div className="text-blue-100 text-xs font-medium mb-1">
                          ESTADO
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              turnoHoy.fuera_de_horario &&
                              !turnoHoy.asistencia.tiene_entrada
                                ? "bg-red-500"
                                : turnoHoy.asistencia.tiene_salida
                                ? "bg-emerald-400"
                                : turnoHoy.asistencia.tiene_entrada
                                ? "bg-blue-400 animate-pulse"
                                : turnoHoy.esta_atrasado
                                ? "bg-amber-400 animate-pulse"
                                : "bg-blue-300"
                            }`}
                          />
                          <span className="text-white text-sm font-medium">
                            {turnoHoy.fuera_de_horario &&
                            !turnoHoy.asistencia.tiene_entrada
                              ? "Ausente"
                              : turnoHoy.asistencia.tiene_salida
                              ? "Finalizado"
                              : turnoHoy.asistencia.tiene_entrada
                              ? "En Turno"
                              : turnoHoy.esta_atrasado
                              ? "Atrasado"
                              : "A Tiempo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="lg:w-64 flex flex-col justify-center gap-3">
                    {turnoHoy.puede_marcar_entrada && (
                      <motion.button
                        whileHover={{
                          scale: turnoHoy.fuera_de_horario ? 1 : 1.02,
                        }}
                        whileTap={{
                          scale: turnoHoy.fuera_de_horario ? 1 : 0.98,
                        }}
                        onClick={marcarEntrada}
                        disabled={
                          loadingAsistencia || turnoHoy.fuera_de_horario
                        }
                        className={`w-full px-6 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
                          turnoHoy.fuera_de_horario
                            ? "bg-red-100 text-red-700 cursor-not-allowed"
                            : turnoHoy.esta_atrasado
                            ? "bg-amber-100 hover:bg-amber-200 text-amber-700"
                            : "bg-white text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={
                              turnoHoy.fuera_de_horario
                                ? "M6 18L18 6M6 6l12 12"
                                : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            }
                          />
                        </svg>
                        {loadingAsistencia
                          ? "Procesando..."
                          : turnoHoy.fuera_de_horario
                          ? "⛔ Turno Finalizado"
                          : turnoHoy.esta_atrasado
                          ? "⚠️ Marcar Entrada (Atrasado)"
                          : "Marcar Entrada"}
                      </motion.button>
                    )}

                    {turnoHoy.puede_marcar_salida && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={marcarSalida}
                        disabled={loadingAsistencia}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 px-6 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        {loadingAsistencia
                          ? "Procesando..."
                          : "Finalizar Turno"}
                      </motion.button>
                    )}

                    {turnoHoy.asistencia.tiene_salida && (
                      <div className="bg-emerald-500/20 border-2 border-emerald-400/50 backdrop-blur-sm px-6 py-4 rounded-xl text-center">
                        <div className="text-white font-bold text-lg mb-1">
                          ✓ Turno Completado
                        </div>
                        <div className="text-emerald-100 text-sm">
                          Total trabajado:{" "}
                          {turnoHoy.asistencia.horas_trabajadas}h
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Sin turno programado
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  No tienes turnos asignados para el día de hoy
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Cards - Modern Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Citas Hoy",
              value: stats.citas_hoy,
              icon: "📅",
              color: "from-blue-500 to-blue-600",
              textColor: "text-blue-600",
              bgColor: "bg-blue-50 dark:bg-blue-900/20",
            },
            {
              label: "Atendidas",
              value: stats.atendidos_hoy,
              icon: "✓",
              color: "from-emerald-500 to-emerald-600",
              textColor: "text-emerald-600",
              bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
            },
            {
              label: "Pendientes",
              value: stats.pendientes_hoy,
              icon: "⏱",
              color: "from-amber-500 to-amber-600",
              textColor: "text-amber-600",
              bgColor: "bg-amber-50 dark:bg-amber-900/20",
            },
            {
              label: "Canceladas",
              value: stats.cancelados_hoy,
              icon: "✕",
              color: "from-red-500 to-red-600",
              textColor: "text-red-600",
              bgColor: "bg-red-50 dark:bg-red-900/20",
            },
            {
              label: "Total Pacientes",
              value: stats.total_pacientes_mes,
              icon: "👥",
              color: "from-violet-500 to-violet-600",
              textColor: "text-violet-600",
              bgColor: "bg-violet-50 dark:bg-violet-900/20",
              subtitle: "Este mes",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center text-2xl`}
                >
                  {stat.icon}
                </div>
              </div>
              <div
                className={`text-4xl font-bold ${stat.textColor} dark:text-white mb-1`}
              >
                {stat.value}
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
              {stat.subtitle && (
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {stat.subtitle}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Appointments List - Clean Table Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Agenda del Día
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {citasHoy.length} cita{citasHoy.length !== 1 ? "s" : ""}{" "}
                  programada{citasHoy.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Actualizado ahora
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {citasHoy.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Sin citas programadas
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  No hay consultas agendadas para el día de hoy
                </p>
              </div>
            ) : (
              citasHoy.map((cita, index) => (
                <motion.div
                  key={cita.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  onClick={() =>
                    navigate("/doctor/citas", {
                      state: { highlightCitaId: cita.id },
                    })
                  }
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-6">
                    {/* Time Badge */}
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-3 shadow-md group-hover:shadow-lg transition-shadow">
                        <div className="text-2xl font-bold leading-none">
                          {new Date(cita.fecha_atencion).toLocaleTimeString(
                            "es-CL",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Patient Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                        {cita.paciente.nombre} {cita.paciente.apellido_paterno}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-1">
                        {cita.motivo_consulta || "Sin motivo especificado"}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border ${getEstadoColor(
                          cita.estado_actual
                        )}`}
                      >
                        {cita.estado_actual}
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 text-gray-400 group-hover:text-blue-500 transition-colors">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
