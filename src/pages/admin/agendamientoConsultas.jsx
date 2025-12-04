import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChileDayStart,
  getChileDayEnd,
  chileTimeToUTC,
} from "../../utils/dateUtils";

const API_URL = "http://localhost:5000";

// Funciones de fetch para React Query
const fetchEspecialidades = async () => {
  const { data } = await axios.get(`${API_URL}/Citas/listar-especialidades`);
  return data.especialidades || [];
};

const fetchDoctores = async (especialidadId) => {
  const params = especialidadId ? { especialidad_id: especialidadId } : {};
  const { data } = await axios.get(`${API_URL}/Citas/listar-doctores`, {
    params,
  });
  return data.doctores || [];
};

const fetchPacientes = async () => {
  const { data } = await axios.get(`${API_URL}/Pacientes/listar-pacientes`);
  return data.pacientes || [];
};

const fetchCitas = async ({ fecha, doctorId, estado }) => {
  const params = {};
  if (fecha) params.fecha = fecha;
  if (doctorId && doctorId !== "all") params.doctor_id = doctorId;
  if (estado && estado !== "all") params.estado_nombre = estado;

  const { data } = await axios.get(`${API_URL}/Citas/listar-citas`, { params });
  return data.citas || [];
};

const fetchHorariosDisponibles = async (doctorId, fecha) => {
  if (!doctorId || !fecha) return [];

  const fechaInicio = getChileDayStart(fecha);
  const fechaFin = getChileDayEnd(fecha);

  const { data } = await axios.get(`${API_URL}/Horarios/horarios-disponibles`, {
    params: {
      doctor_id: doctorId,
      fecha_inicio: fechaInicio.toISOString(),
      fecha_fin: fechaFin.toISOString(),
    },
  });
  return data.horarios_disponibles || [];
};

export default function AgendamientoConsultas() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  const [selectedEstado, setSelectedEstado] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notificacion, setNotificacion] = useState({
    show: false,
    mensaje: "",
    tipo: "",
  });

  // Formulario nueva cita
  const [formData, setFormData] = useState({
    especialidad_id: "",
    paciente_id: "",
    doctor_id: "",
    fecha: today,
    hora: "08:00",
    motivo_consulta: "",
  });

  const [doctoresFiltradosEditar, setDoctoresFiltradosEditar] = useState([]);
  const [horariosEditar, setHorariosEditar] = useState([]);

  // Formulario editar cita
  const [editFormData, setEditFormData] = useState({
    especialidad_id: "",
    paciente_id: "",
    doctor_id: "",
    fecha: "",
    hora: "",
    motivo_consulta: "",
  });

  // REACT QUERY - Caché automático
  const { data: especialidades = [] } = useQuery({
    queryKey: ["especialidades"],
    queryFn: fetchEspecialidades,
  });

  const { data: doctores = [] } = useQuery({
    queryKey: ["doctores"],
    queryFn: () => fetchDoctores(null),
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes"],
    queryFn: fetchPacientes,
  });

  const {
    data: citas = [],
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: ["citas", selectedDate, selectedDoctor, selectedEstado],
    queryFn: () =>
      fetchCitas({
        fecha: selectedDate,
        doctorId: selectedDoctor,
        estado: selectedEstado,
      }),
  });

  const { data: doctoresFiltrados = [] } = useQuery({
    queryKey: ["doctores", formData.especialidad_id],
    queryFn: () => fetchDoctores(formData.especialidad_id),
    enabled: !!formData.especialidad_id,
  });

  const { data: horariosDisponibles = [] } = useQuery({
    queryKey: ["horarios-disponibles", formData.doctor_id, formData.fecha],
    queryFn: () => fetchHorariosDisponibles(formData.doctor_id, formData.fecha),
    enabled: !!formData.doctor_id && !!formData.fecha,
  });

  // Estadísticas computadas desde citas
  const estadisticas = {
    total: citas.length,
    confirmadas: citas.filter((c) => c.estado === "CONFIRMADA").length,
    pendientes: citas.filter((c) => c.estado === "PENDIENTE").length,
    en_consulta: citas.filter((c) => c.estado === "EN_CONSULTA").length,
    canceladas: citas.filter((c) => c.estado === "CANCELADA").length,
  };

  const mostrarNotificacion = (mensaje, tipo) => {
    setNotificacion({ show: true, mensaje, tipo });
    setTimeout(() => {
      setNotificacion({ show: false, mensaje: "", tipo: "" });
    }, 3000);
  };

  // Funciones de edición - mantienen lógica antigua temporalmente
  const cargarDoctoresPorEspecialidadEditar = async (especialidadId) => {
    try {
      const response = await axios.get(`${API_URL}/Citas/listar-doctores`, {
        params: { especialidad_id: especialidadId },
      });
      setDoctoresFiltradosEditar(response.data.doctores || []);
    } catch (err) {
      console.error("Error al cargar doctores por especialidad:", err);
      setDoctoresFiltradosEditar([]);
    }
  };

  const cargarHorariosDisponiblesEditar = async (doctorId, fecha) => {
    try {
      const fechaInicio = getChileDayStart(fecha);
      const fechaFin = getChileDayEnd(fecha);

      const { data } = await axios.get(
        `${API_URL}/Horarios/horarios-disponibles`,
        {
          params: {
            doctor_id: doctorId,
            fecha_inicio: fechaInicio.toISOString(),
            fecha_fin: fechaFin.toISOString(),
          },
        }
      );
      const horarios = data.horarios_disponibles || [];
      setHorariosEditar(horarios);
      return horarios;
    } catch (err) {
      console.error("Error al cargar horarios:", err);
      setHorariosEditar([]);
      return [];
    }
  };

  // Cargar doctores cuando cambia la especialidad en edición
  useEffect(() => {
    if (editFormData.especialidad_id && showEditModal) {
      cargarDoctoresPorEspecialidadEditar(editFormData.especialidad_id);
    }
  }, [editFormData.especialidad_id, showEditModal]);

  // Cargar horarios cuando cambia doctor O fecha en edición
  useEffect(() => {
    if (showEditModal && editFormData.doctor_id && editFormData.fecha) {
      // Ambos deben existir para cargar horarios
      cargarHorariosDisponiblesEditar(
        editFormData.doctor_id,
        editFormData.fecha
      );
    } else if (showEditModal) {
      // Si falta doctor o fecha, limpiar horarios
      setHorariosEditar([]);
    }
  }, [editFormData.doctor_id, editFormData.fecha, showEditModal]);

  const crearCita = async () => {
    try {
      if (horariosDisponibles.length > 0 && !formData.hora) {
        mostrarNotificacion(
          "Por favor, seleccione un horario disponible",
          "error"
        );
        return;
      }

      const fechaHoraUTC = chileTimeToUTC(formData.fecha, formData.hora);

      const payload = {
        cita: {
          fecha_atencion: fechaHoraUTC,
          paciente_id: parseInt(formData.paciente_id),
          doctor_id: parseInt(formData.doctor_id),
          especialidad_id: parseInt(formData.especialidad_id),
        },
        informacion: {
          motivo_consulta: formData.motivo_consulta,
        },
        estado_inicial: "Pendiente",
      };

      await axios.post(`${API_URL}/Citas/crear-cita`, payload);
      setShowModal(false);
      setFormData({
        especialidad_id: "",
        paciente_id: "",
        doctor_id: "",
        fecha: today,
        hora: "08:00",
        motivo_consulta: "",
      });
      queryClient.invalidateQueries(["citas"]);
      mostrarNotificacion("Cita creada exitosamente", "success");
    } catch (err) {
      console.error("Error al crear cita:", err);
      mostrarNotificacion(
        err.response?.data?.detail || "Error al crear la cita",
        "error"
      );
    }
  };

  const cambiarEstado = async (citaId, nuevoEstado) => {
    try {
      await axios.put(`${API_URL}/Citas/cambiar-estado/${citaId}`, {
        estado: nuevoEstado,
      });
      cargarCitas();
      cargarEstadisticas();
      mostrarNotificacion(`Estado cambiado a ${nuevoEstado}`, "success");
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      mostrarNotificacion(
        err.response?.data?.detail || "Error al cambiar el estado",
        "error"
      );
    }
  };

  const verDetalleCita = async (citaId) => {
    try {
      const response = await axios.get(`${API_URL}/Citas/cita/${citaId}`);
      setSelectedCita(response.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Error al cargar detalle:", err);
      mostrarNotificacion("Error al cargar el detalle de la cita", "error");
    }
  };

  const abrirEditarCita = async (cita) => {
    setSelectedCita(cita);

    const fechaUTC = new Date(cita.fecha_atencion);
    const fechaChile = new Date(fechaUTC.getTime() - 3 * 60 * 60 * 1000);

    const fechaStr = fechaChile.toISOString().split("T")[0];
    const horaStr = fechaChile.toISOString().substring(11, 16);

    // Cargar doctores de la especialidad actual
    if (cita.especialidad?.id) {
      await cargarDoctoresPorEspecialidadEditar(cita.especialidad.id);
    }

    setEditFormData({
      especialidad_id: cita.especialidad?.id || "",
      paciente_id: cita.paciente?.id || "",
      doctor_id: cita.doctor?.id || "",
      fecha: fechaStr,
      hora: horaStr,
      motivo_consulta: cita.motivo_consulta || "",
    });

    // Cargar horarios ANTES de abrir el modal
    if (cita.doctor?.id && fechaStr) {
      await cargarHorariosDisponiblesEditar(cita.doctor.id, fechaStr);
    }

    setShowEditModal(true);
  };

  const editarCita = async () => {
    try {
      if (!editFormData.fecha || !editFormData.hora) {
        mostrarNotificacion(
          "Por favor, seleccione una fecha y hora para la cita",
          "error"
        );
        return;
      }

      if (!editFormData.doctor_id) {
        mostrarNotificacion("Por favor, seleccione un doctor", "error");
        return;
      }

      const fechaHoraUTC = chileTimeToUTC(
        editFormData.fecha,
        editFormData.hora
      );

      // Actualizar fecha y doctor
      await axios.put(`${API_URL}/Citas/modificar-cita/${selectedCita.id}`, {
        fecha_atencion: fechaHoraUTC,
        doctor_id: editFormData.doctor_id,
      });

      // Actualizar motivo si cambió
      if (
        editFormData.motivo_consulta &&
        editFormData.motivo_consulta !== selectedCita.motivo_consulta
      ) {
        await axios.put(
          `${API_URL}/Citas/modificar-informacion/${selectedCita.id}`,
          {
            motivo_consulta: editFormData.motivo_consulta,
          }
        );
      }

      setShowEditModal(false);
      setDoctoresFiltradosEditar([]);
      queryClient.invalidateQueries(["citas"]);
      mostrarNotificacion("Cita actualizada exitosamente", "success");
    } catch (err) {
      console.error("Error al editar cita:", err);
      mostrarNotificacion(
        err.response?.data?.detail || "Error al editar la cita",
        "error"
      );
    }
  };

  const cancelarCita = async (citaId) => {
    if (!confirm("¿Está seguro de cancelar esta cita?")) return;

    try {
      await axios.delete(`${API_URL}/Citas/cancelar-cita/${citaId}`);
      queryClient.invalidateQueries(["citas"]);
      mostrarNotificacion("Cita cancelada exitosamente", "success");
    } catch (err) {
      console.error("Error al cancelar cita:", err);
      mostrarNotificacion(
        err.response?.data?.detail || "Error al cancelar la cita",
        "error"
      );
    }
  };

  const formatearFechaHora = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const hora = fecha.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return hora;
  };

  const formatearNombreCompleto = (persona) => {
    if (!persona) return "N/A";
    return `${persona.nombre} ${persona.apellido_paterno || ""} ${
      persona.apellido_materno || ""
    }`.trim();
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Confirmada":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800";
      case "Pendiente":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800";
      case "En Consulta":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800";
      case "Cancelada":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-800";
    }
  };

  // Filtrar citas por búsqueda
  const citasFiltradas = citas.filter(
    (cita) =>
      formatearNombreCompleto(cita.paciente)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      formatearNombreCompleto(cita.doctor)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      cita.paciente?.rut?.includes(searchTerm)
  );

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
                  <svg
                    className="w-6 h-6 flex-shrink-0"
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
                ) : (
                  <svg
                    className="w-6 h-6 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                <p className="font-semibold">{notificacion.mensaje}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                <svg
                  className="w-8 h-8 text-white"
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
              Agendamiento de Consultas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestión integral de citas médicas
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 font-semibold"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Nueva Cita
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {estadisticas.total}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl flex items-center justify-center">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {estadisticas.confirmadas}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Confirmadas
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl flex items-center justify-center">
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
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {estadisticas.pendientes}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Pendientes
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl flex items-center justify-center">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {estadisticas.en_consulta}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                En Consulta
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
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
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {estadisticas.canceladas}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Canceladas
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Filtros Modernos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6"
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-gray-400"
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filtros
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Búsqueda
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar paciente, doctor o RUT..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Doctor
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
              >
                <option value="all">Todos los doctores</option>
                {doctores.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {formatearNombreCompleto(doctor)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select
                value={selectedEstado}
                onChange={(e) => setSelectedEstado(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
              >
                <option value="all">Todos los estados</option>
                <option value="Confirmada">Confirmada</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En Consulta">En Consulta</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lista de Citas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Cargando citas...
            </p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">
            Error al cargar citas
          </div>
        ) : citasFiltradas.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? "Sin resultados" : "No hay citas"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? "Intenta con otro término de búsqueda"
                : "Las citas programadas aparecerán aquí"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Hora
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {citasFiltradas.map((cita, index) => (
                  <motion.tr
                    key={cita.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatearFechaHora(cita.fecha_atencion)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatearNombreCompleto(cita.paciente)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {cita.paciente?.rut || "Sin RUT"} •{" "}
                        {cita.paciente?.telefono || "Sin tel."}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatearNombreCompleto(cita.doctor)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${getEstadoColor(
                          cita.estado_actual
                        )}`}
                      >
                        {cita.estado_actual}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => verDetalleCita(cita.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Ver detalle"
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => abrirEditarCita(cita)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                          title="Editar"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </motion.button>
                        <select
                          value={cita.estado_actual}
                          onChange={(e) =>
                            cambiarEstado(cita.id, e.target.value)
                          }
                          className="text-sm px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 font-medium"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Confirmada">Confirmada</option>
                          <option value="En Consulta">En Consulta</option>
                          <option value="Completada">Completada</option>
                          <option value="Cancelada">Cancelada</option>
                        </select>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => cancelarCita(cita.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Cancelar cita"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal Nueva Cita - Optimizado */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      Nueva Cita Médica
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-white"
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

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Paciente *
                      </label>
                      <select
                        value={formData.paciente_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paciente_id: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
                        required
                      >
                        <option value="">Seleccionar paciente</option>
                        {pacientes.map((paciente) => (
                          <option key={paciente.id} value={paciente.id}>
                            {formatearNombreCompleto(paciente)} - {paciente.rut}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Especialidad *
                      </label>
                      <select
                        value={formData.especialidad_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            especialidad_id: e.target.value,
                            doctor_id: "",
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
                        required
                      >
                        <option value="">Seleccionar especialidad</option>
                        {especialidades.map((especialidad) => (
                          <option key={especialidad.id} value={especialidad.id}>
                            {especialidad.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Doctor *
                      </label>
                      <select
                        value={formData.doctor_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            doctor_id: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
                        required
                        disabled={!formData.especialidad_id}
                      >
                        <option value="">
                          {!formData.especialidad_id
                            ? "Primero seleccione una especialidad"
                            : "Seleccionar doctor"}
                        </option>
                        {doctoresFiltrados.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {formatearNombreCompleto(doctor)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Fecha *
                      </label>
                      <input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) =>
                          setFormData({ ...formData, fecha: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Horario Disponible *
                      </label>
                      {horariosDisponibles.length > 0 ? (
                        <select
                          value={formData.hora}
                          onChange={(e) =>
                            setFormData({ ...formData, hora: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
                          required
                        >
                          <option value="">Seleccione un horario...</option>
                          {horariosDisponibles.map((horario) => {
                            const inicioUTC = new Date(horario.inicio_bloque);
                            const finUTC = new Date(
                              horario.finalizacion_bloque
                            );

                            const inicioChile = new Date(
                              inicioUTC.getTime() - 3 * 60 * 60 * 1000
                            );
                            const finChile = new Date(
                              finUTC.getTime() - 3 * 60 * 60 * 1000
                            );

                            const horaInicio = inicioChile
                              .toISOString()
                              .substring(11, 16);
                            const horaFin = finChile
                              .toISOString()
                              .substring(11, 16);

                            return (
                              <option key={horario.id} value={horaInicio}>
                                {horaInicio} - {horaFin}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <div className="w-full px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-sm flex items-center gap-2">
                          <svg
                            className="w-5 h-5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <span>
                            {formData.doctor_id && formData.fecha
                              ? "No hay horarios disponibles"
                              : "Seleccione doctor y fecha"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Motivo de Consulta
                      </label>
                      <textarea
                        rows="3"
                        value={formData.motivo_consulta}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            motivo_consulta: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all resize-none"
                        placeholder="Describa el motivo de la consulta..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={crearCita}
                  disabled={!formData.paciente_id || !formData.doctor_id}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Agendar Cita
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Editar Cita - Similar estructura optimizada */}
      <AnimatePresence>
        {showEditModal && selectedCita && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Editar Cita
                      </h2>
                      <p className="text-emerald-100 text-sm mt-1">
                        {formatearNombreCompleto(selectedCita.paciente)} - Dr.{" "}
                        {formatearNombreCompleto(selectedCita.doctor)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-white"
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

              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Paciente (solo lectura) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Paciente
                    </label>
                    <input
                      type="text"
                      value={formatearNombreCompleto(selectedCita.paciente)}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white cursor-not-allowed"
                    />
                  </div>

                  {/* Especialidad */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Especialidad *
                    </label>
                    <select
                      value={editFormData.especialidad_id}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          especialidad_id: e.target.value,
                          doctor_id: "",
                          hora: "",
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
                      required
                    >
                      <option value="">Seleccione especialidad...</option>
                      {especialidades.map((esp) => (
                        <option key={esp.id} value={esp.id}>
                          {esp.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Doctor */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Doctor *
                    </label>
                    <select
                      value={editFormData.doctor_id}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          doctor_id: e.target.value,
                          hora: "",
                        })
                      }
                      disabled={!editFormData.especialidad_id}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">
                        {editFormData.especialidad_id
                          ? "Seleccione un doctor..."
                          : "Primero seleccione especialidad"}
                      </option>
                      {doctoresFiltradosEditar.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          Dr. {doc.nombre} {doc.apellido_paterno}{" "}
                          {doc.apellido_materno}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Nueva Fecha *
                    </label>
                    <input
                      type="date"
                      value={editFormData.fecha}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          fecha: e.target.value,
                          hora: "",
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
                      required
                    />
                  </div>

                  {/* Horario */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Nuevo Horario *
                    </label>
                    {horariosEditar.length > 0 ? (
                      <select
                        value={editFormData.hora}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            hora: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
                        required
                      >
                        <option value="">Seleccione un horario...</option>
                        {horariosEditar.map((horario) => {
                          const inicioUTC = new Date(horario.inicio_bloque);
                          const finUTC = new Date(horario.finalizacion_bloque);

                          const inicioChile = new Date(
                            inicioUTC.getTime() - 3 * 60 * 60 * 1000
                          );
                          const finChile = new Date(
                            finUTC.getTime() - 3 * 60 * 60 * 1000
                          );

                          const horaInicio = inicioChile
                            .toISOString()
                            .substring(11, 16);
                          const horaFin = finChile
                            .toISOString()
                            .substring(11, 16);

                          return (
                            <option key={horario.id} value={horaInicio}>
                              {horaInicio} - {horaFin}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <div className="w-full px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-sm">
                        {editFormData.fecha && editFormData.doctor_id
                          ? "⚠️ No hay horarios disponibles"
                          : "ℹ️ Seleccione doctor y fecha"}
                      </div>
                    )}
                  </div>

                  {/* Motivo */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Motivo de Consulta (opcional)
                    </label>
                    <textarea
                      rows="3"
                      value={editFormData.motivo_consulta}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          motivo_consulta: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white transition-all resize-none"
                      placeholder="Actualizar motivo de consulta..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowEditModal(false);
                    setDoctoresFiltradosEditar([]);
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={editarCita}
                  disabled={
                    !editFormData.fecha ||
                    !editFormData.hora ||
                    !editFormData.doctor_id
                  }
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Guardar Cambios
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Detalle Cita - Optimizado */}
      <AnimatePresence>
        {showDetailModal && selectedCita && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <svg
                        className="w-6 h-6 text-white"
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
                    <h2 className="text-2xl font-bold text-white">
                      Detalle de Cita
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-white"
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

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
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
                      Paciente
                    </h3>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatearNombreCompleto(selectedCita.cita?.paciente)}
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>RUT: {selectedCita.cita?.paciente?.rut}</p>
                      <p>Tel: {selectedCita.cita?.paciente?.telefono}</p>
                      <p>Email: {selectedCita.cita?.paciente?.correo}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-5 rounded-xl border border-purple-200 dark:border-purple-800">
                    <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
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
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      Doctor
                    </h3>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatearNombreCompleto(selectedCita.cita?.doctor)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Fecha y Hora
                    </h3>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {new Date(
                        selectedCita.cita?.fecha_atencion
                      ).toLocaleString("es-CL")}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-5 rounded-xl border border-amber-200 dark:border-amber-800">
                    <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Estado
                    </h3>
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold ${getEstadoColor(
                        selectedCita.estado_actual
                      )}`}
                    >
                      {selectedCita.estado_actual}
                    </span>
                  </div>
                </div>

                {selectedCita.informacion && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
                      Información Clínica
                    </h3>
                    <div className="space-y-4">
                      {selectedCita.informacion.motivo_consulta && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Motivo de Consulta
                          </h4>
                          <p className="text-gray-900 dark:text-white">
                            {selectedCita.informacion.motivo_consulta}
                          </p>
                        </div>
                      )}
                      {selectedCita.informacion.antecedentes && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Antecedentes
                          </h4>
                          <p className="text-gray-900 dark:text-white">
                            {selectedCita.informacion.antecedentes}
                          </p>
                        </div>
                      )}
                      {selectedCita.informacion.evaluacion_doctor && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Evaluación del Doctor
                          </h4>
                          <p className="text-gray-900 dark:text-white">
                            {selectedCita.informacion.evaluacion_doctor}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                >
                  Cerrar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
