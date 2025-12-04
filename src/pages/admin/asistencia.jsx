/**
 * Vista profesional de asistencia de doctores
 * Timeline + Cards + Panel lateral de detalle
 * Diseño moderno glassmórfico con actualizaciones en tiempo real
 * OPTIMIZADO: React Query para caché inteligente
 */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import * as XLSX from "xlsx";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  generarReporteAsistenciaPDF,
  generarReporteGeneralPDF,
} from "../../utils/generarReporteAsistenciaPDF";

const API_URL = "http://localhost:5000";

// Helper para parsear fechas UTC del backend correctamente
const parseUTCDate = (dateString) => {
  if (!dateString) return null;
  const dateStr = dateString.endsWith("Z") ? dateString : dateString + "Z";
  return new Date(dateStr);
};

// Funciones de fetch para React Query
const fetchTurnosDia = async (fecha) => {
  const params = fecha ? { fecha } : {};
  const { data } = await axios.get(`${API_URL}/asistencia/turnos-dia`, {
    params,
  });

  const turnosData = data?.turnos || [];
  return turnosData.map((turno) => {
    const nombreCompleto =
      turno.doctor.nombre_completo ||
      `${turno.doctor.nombre || ""} ${turno.doctor.apellido_paterno || ""} ${
        turno.doctor.apellido_materno || ""
      }`.trim() ||
      "Doctor sin nombre";

    return {
      id: turno.id,
      usuario_sistema_id: turno.doctor.id,
      usuario_sistema: {
        id: turno.doctor.id,
        nombre: turno.doctor.nombre || "",
        apellido_paterno: turno.doctor.apellido_paterno || "",
        apellido_materno: turno.doctor.apellido_materno || "",
        nombre_completo: nombreCompleto,
        rut: turno.doctor.rut || "",
        especialidades: Array.isArray(turno.doctor.especialidades)
          ? turno.doctor.especialidades
          : [],
        email: turno.doctor.email || "",
        celular: turno.doctor.celular || "",
        rol: { nombre: "Doctor" },
      },
      inicio_turno: turno.marca_entrada || turno.inicio_turno,
      finalizacion_turno: turno.marca_salida,
      estado: turno.estado_asistencia,
      minutos_atraso: turno.minutos_atraso || 0,
      marca_entrada: turno.marca_entrada,
      marca_salida: turno.marca_salida,
    };
  });
};

export default function Asistencia() {
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState(null);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);
  const [filtros, setFiltros] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    usuario_id: "",
    solo_activos: false,
  });

  // REACT QUERY - Caché automático de 5 minutos
  const {
    data: asistencias = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["turnos-dia", filtros.fecha_inicio || filtros.fecha_fin],
    queryFn: () => fetchTurnosDia(filtros.fecha_inicio || filtros.fecha_fin),
    staleTime: 2 * 60 * 1000, // 2 minutos para asistencia (datos más dinámicos)
  });

  const turnosActivos = useMemo(() => {
    return asistencias
      .filter((t) => t.estado === "EN_TURNO")
      .map((t) => ({
        usuario_sistema_id: t.usuario_sistema_id,
        id: t.id,
      }));
  }, [asistencias]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => setMenuAbiertoId(null);
    if (menuAbiertoId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [menuAbiertoId]);
  const cargarTurnosActivos = async () => {
    try {
      const response = await axios.get(`${API_URL}/asistencia/turnos-dia`);
      const turnosEnCurso =
        response.data?.turnos?.filter((t) => t.estado === "EN_TURNO") || [];
      setTurnosActivos(
        turnosEnCurso.map((t) => ({
          usuario_sistema_id: t.doctor.id,
          id: t.asistencia_id,
        }))
      );
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error al cargar turnos activos:", error);
      }
    }
  };

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => setMenuAbiertoId(null);
    if (menuAbiertoId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [menuAbiertoId]);

  const showNotification = (type, message) => {
    setNotification({ id: Date.now(), type, message });
  };

  const handleFiltroChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFiltros({ ...filtros, [name]: type === "checkbox" ? checked : value });
  };

  const aplicarFiltros = () => {
    refetch(); // React Query refetch
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha_inicio: "",
      fecha_fin: "",
      usuario_id: "",
      solo_activos: false,
    });
    setTimeout(() => refetch(), 100);
  };

  const registrarSalida = async (asistenciaId) => {
    try {
      await axios.post(
        `${API_URL}/asistencia/registrar-salida/${asistenciaId}`
      );
      showNotification("success", "Salida registrada correctamente");
      await refetch(); // Refetch con React Query
    } catch (error) {
      showNotification(
        "error",
        error.response?.data?.detail || "Error al registrar salida"
      );
    }
  };

  const getEmpleadoNombre = (empleadoData) => {
    if (!empleadoData) return "N/A";
    return `${empleadoData.nombre} ${empleadoData.apellido_paterno} ${
      empleadoData.apellido_materno || ""
    }`.trim();
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "-";
    const date = new Date(dateTimeString);
    return date.toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return "-";
    const date = parseUTCDate(dateTimeString);
    if (!date) return "-";
    return date.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateTimeString) => {
    if (!dateTimeString) return "-";
    const date = parseUTCDate(dateTimeString);
    if (!date) return "-";
    return date.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const calcularHorasTrabajadas = (inicio, fin) => {
    if (!inicio || !fin) return 0;
    const inicioDate = parseUTCDate(inicio);
    const finDate = parseUTCDate(fin);
    if (!inicioDate || !finDate) return 0;
    return (finDate - inicioDate) / 1000 / 60 / 60;
  };

  const formatearRUT = (rut) => {
    if (!rut) return "N/A";
    let rutLimpio = rut.toString().replace(/[^0-9kK]/g, "");
    const dv = rutLimpio.slice(-1);
    let rutNumeros = rutLimpio.slice(0, -1);
    rutNumeros = rutNumeros.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${rutNumeros}-${dv}`;
  };

  // Estadísticas generales
  const estadisticasGenerales = useMemo(() => {
    const activos = turnosActivos.length;
    const hoy = new Date().toDateString();
    const totalHorasHoy = asistencias
      .filter((a) => {
        const fecha = parseUTCDate(a.inicio_turno);
        return fecha && fecha.toDateString() === hoy;
      })
      .reduce(
        (acc, a) =>
          acc + calcularHorasTrabajadas(a.inicio_turno, a.finalizacion_turno),
        0
      );

    const completadosHoy = asistencias.filter((a) => {
      const fecha = parseUTCDate(a.inicio_turno);
      return fecha && fecha.toDateString() === hoy && a.finalizacion_turno;
    }).length;

    const promedio = completadosHoy > 0 ? totalHorasHoy / completadosHoy : 0;

    return { activos, totalHorasHoy, completadosHoy, promedio };
  }, [asistencias, turnosActivos]);

  // Asistencias filtradas por búsqueda
  const asistenciasFiltradas = useMemo(() => {
    return asistencias.filter((asistencia) => {
      const empleadoData = asistencia.usuario_sistema;
      const nombreCompleto = getEmpleadoNombre(empleadoData).toLowerCase();
      const rut = empleadoData?.rut?.toLowerCase() || "";
      return (
        nombreCompleto.includes(searchTerm.toLowerCase()) ||
        rut.includes(searchTerm.toLowerCase())
      );
    });
  }, [asistencias, searchTerm]);

  // Estadísticas del empleado seleccionado
  const estadisticasEmpleado = useMemo(() => {
    if (!empleadoSeleccionado) return null;

    const asistenciasEmpleado = asistencias.filter(
      (a) => a.usuario_sistema_id === empleadoSeleccionado.id
    );

    console.log(
      "🔍 Asistencias de empleado:",
      empleadoSeleccionado.nombre,
      asistenciasEmpleado
    );

    // Esta semana
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const asistenciasSemana = asistenciasEmpleado.filter((a) => {
      const fecha = parseUTCDate(a.inicio_turno);
      return fecha && fecha >= inicioSemana;
    });

    const horasSemana = asistenciasSemana.reduce(
      (acc, a) =>
        acc + calcularHorasTrabajadas(a.inicio_turno, a.finalizacion_turno),
      0
    );
    const diasSemana = new Set(
      asistenciasSemana
        .map((a) => {
          const fecha = parseUTCDate(a.inicio_turno);
          return fecha ? fecha.toDateString() : null;
        })
        .filter(Boolean)
    ).size;

    // Este mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const asistenciasMes = asistenciasEmpleado.filter((a) => {
      const fecha = parseUTCDate(a.inicio_turno);
      return fecha && fecha >= inicioMes;
    });

    const horasMes = asistenciasMes.reduce(
      (acc, a) =>
        acc + calcularHorasTrabajadas(a.inicio_turno, a.finalizacion_turno),
      0
    );
    const diasMes = new Set(
      asistenciasMes
        .map((a) => {
          const fecha = parseUTCDate(a.inicio_turno);
          return fecha ? fecha.toDateString() : null;
        })
        .filter(Boolean)
    ).size;

    // Datos para el gráfico (últimos 7 días)
    const datosGrafico = [];
    const diasSemanaLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      fecha.setHours(0, 0, 0, 0);

      const asistenciasDia = asistenciasEmpleado.filter((a) => {
        const fechaAsistencia = parseUTCDate(a.inicio_turno);
        return (
          fechaAsistencia &&
          fechaAsistencia.toDateString() === fecha.toDateString()
        );
      });

      const horasDia = asistenciasDia.reduce(
        (acc, a) =>
          acc + calcularHorasTrabajadas(a.inicio_turno, a.finalizacion_turno),
        0
      );

      datosGrafico.push({
        dia: diasSemanaLabels[fecha.getDay()],
        horas: parseFloat(horasDia.toFixed(2)),
        fecha: fecha.toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "2-digit",
        }),
      });
    }

    // Historial reciente
    const historialReciente = asistenciasEmpleado
      .sort((a, b) => {
        const fechaA = parseUTCDate(a.inicio_turno);
        const fechaB = parseUTCDate(b.inicio_turno);
        if (!fechaA || !fechaB) return 0;
        return fechaB - fechaA;
      })
      .slice(0, 7);

    return {
      horasSemana,
      diasSemana,
      promedioSemana: diasSemana > 0 ? horasSemana / diasSemana : 0,
      horasMes,
      diasMes,
      promedioMes: diasMes > 0 ? horasMes / diasMes : 0,
      datosGrafico,
      historialReciente,
      totalAsistencias: asistenciasEmpleado.length,
      turnosCompletos: asistenciasEmpleado.filter((a) => a.finalizacion_turno)
        .length,
      turnosIncompletos: asistenciasEmpleado.filter(
        (a) => !a.finalizacion_turno
      ).length,
    };
  }, [empleadoSeleccionado, asistencias]);

  // Verificar si empleado está en turno activo
  const empleadoEnTurno = (empleadoId) => {
    return turnosActivos.find((t) => t.usuario_sistema_id === empleadoId);
  };

  // Seleccionar empleado - SIEMPRE usar datos enriquecidos de asistencia.usuario_sistema
  const seleccionarEmpleadoDesdeAsistencia = (asistencia) => {
    if (asistencia.usuario_sistema) {
      // Usar datos enriquecidos que tienen email+celular+especialidades
      setEmpleadoSeleccionado(asistencia.usuario_sistema);
    }
  };

  // Exportar a Excel
  const exportarExcel = () => {
    if (!empleadoSeleccionado || !estadisticasEmpleado) return;

    const asistenciasEmpleado = asistencias
      .filter((a) => a.usuario_sistema_id === empleadoSeleccionado.id)
      .map((a) => {
        const fechaInicio = parseUTCDate(a.inicio_turno);
        return {
          Fecha: fechaInicio ? fechaInicio.toLocaleDateString("es-CL") : "-",
          "Hora Entrada": formatTime(a.inicio_turno),
          "Hora Salida": formatTime(a.finalizacion_turno),
          "Horas Trabajadas": calcularHorasTrabajadas(
            a.inicio_turno,
            a.finalizacion_turno
          ).toFixed(2),
          Estado: a.finalizacion_turno ? "Completo" : "En turno",
        };
      });

    const ws = XLSX.utils.json_to_sheet(asistenciasEmpleado);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Asistencias");

    const nombreArchivo = `Asistencias_${
      empleadoSeleccionado.apellido_paterno
    }_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

  // Generar reporte PDF individual
  const generarReportePDF = async () => {
    if (!empleadoSeleccionado || !estadisticasEmpleado) return;

    const asistenciasEmpleado = asistencias
      .filter((a) => a.usuario_sistema_id === empleadoSeleccionado.id)
      .sort((a, b) => new Date(b.inicio_turno) - new Date(a.inicio_turno));

    const fechaInicio =
      filtros.fecha_inicio ||
      new Date(new Date().setMonth(new Date().getMonth() - 1))
        .toISOString()
        .split("T")[0];
    const fechaFin =
      filtros.fecha_fin || new Date().toISOString().split("T")[0];

    await generarReporteAsistenciaPDF({
      empleado: empleadoSeleccionado,
      asistencias: asistenciasEmpleado,
      fechaInicio,
      fechaFin,
      estadisticas: {
        totalHoras: estadisticasEmpleado.horasMes,
        diasTrabajados: estadisticasEmpleado.diasMes,
        promedioDiario: estadisticasEmpleado.promedioMes,
        turnosCompletos: estadisticasEmpleado.turnosCompletos,
        turnosIncompletos: estadisticasEmpleado.turnosIncompletos,
      },
    });
  };

  // Generar reporte general
  const generarReporteGeneral = async () => {
    const fechaInicio =
      filtros.fecha_inicio ||
      new Date(new Date().setMonth(new Date().getMonth() - 1))
        .toISOString()
        .split("T")[0];
    const fechaFin =
      filtros.fecha_fin || new Date().toISOString().split("T")[0];

    // Obtener doctores únicos de asistencias
    const doctoresUnicos = Array.from(
      new Map(
        asistencias.map((a) => [a.usuario_sistema_id, a.usuario_sistema])
      ).values()
    );

    // Calcular ranking de empleados
    const rankingEmpleados = doctoresUnicos
      .map((doctor) => {
        const asistenciasEmp = asistencias.filter(
          (a) => a.usuario_sistema_id === doctor.id
        );
        const horas = asistenciasEmp.reduce(
          (acc, a) =>
            acc + calcularHorasTrabajadas(a.inicio_turno, a.finalizacion_turno),
          0
        );
        return {
          nombre:
            doctor.nombre_completo ||
            `${doctor.nombre || ""} ${doctor.apellido_paterno || ""}`.trim(),
          rol: doctor.rol?.nombre || "Doctor",
          horas,
          turnos: asistenciasEmp.length,
        };
      })
      .sort((a, b) => b.horas - a.horas);

    const totalHorasEquipo = rankingEmpleados.reduce(
      (acc, e) => acc + e.horas,
      0
    );

    await generarReporteGeneralPDF({
      asistencias,
      empleados: doctoresUnicos,
      fechaInicio,
      fechaFin,
      estadisticasGenerales: {
        totalEmpleados: doctoresUnicos.length,
        totalHorasEquipo,
        promedioHorasPorEmpleado:
          doctoresUnicos.length > 0
            ? totalHorasEquipo / doctoresUnicos.length
            : 0,
        totalTurnos: asistencias.length,
        rankingEmpleados,
      },
    });
  };

  // Colores para el gráfico
  const getBarColor = (horas) => {
    if (horas >= 8) return "#10B981"; // Verde
    if (horas >= 6) return "#3B82F6"; // Azul
    if (horas > 0) return "#F59E0B"; // Amarillo
    return "#E5E7EB"; // Gris
  };

  // Obtener iniciales para avatar
  const getIniciales = (empleado) => {
    if (!empleado) return "?";
    const nombre = empleado.nombre?.charAt(0) || "";
    const apellido = empleado.apellido_paterno?.charAt(0) || "";
    return `${nombre}${apellido}`.toUpperCase();
  };

  // Color de avatar basado en rol
  const getAvatarColor = (rol) => {
    const colores = {
      doctor: "from-blue-500 to-blue-600",
      secretaria: "from-purple-500 to-purple-600",
      administrador: "from-red-500 to-red-600",
      enfermera: "from-green-500 to-green-600",
    };
    return colores[rol?.toLowerCase()] || "from-gray-500 to-gray-600";
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Notificaciones */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
              notification.type === "success" ? "bg-green-500" : "bg-red-500"
            } text-white`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header compacto */}
      <div className="flex-shrink-0 px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Gestión de Asistencia
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Control de entrada y salida de empleados
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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
            {new Date().toLocaleDateString("es-CL", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </div>
        </div>

        {/* Stats Cards - Compactos */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-2.5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">En Turno</p>
                <p className="text-xl font-bold">
                  {estadisticasGenerales.activos}
                </p>
              </div>
              <div className="p-1.5 bg-white/20 rounded">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-2.5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Horas Hoy</p>
                <p className="text-xl font-bold">
                  {estadisticasGenerales.totalHorasHoy.toFixed(1)}
                </p>
              </div>
              <div className="p-1.5 bg-white/20 rounded">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-2.5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Promedio</p>
                <p className="text-xl font-bold">
                  {estadisticasGenerales.promedio.toFixed(1)}h
                </p>
              </div>
              <div className="p-1.5 bg-white/20 rounded">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow p-2.5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Completados</p>
                <p className="text-xl font-bold">
                  {estadisticasGenerales.completadosHoy}
                </p>
              </div>
              <div className="p-1.5 bg-white/20 rounded">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Split View Principal */}
      <div className="flex-1 flex gap-4 px-6 pb-4 overflow-hidden">
        {/* Panel Izquierdo - 55% */}
        <div className="w-[55%] flex flex-col gap-3 overflow-hidden">
          {/* Filtros - Solo en panel izquierdo */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                name="fecha_inicio"
                value={filtros.fecha_inicio}
                onChange={handleFiltroChange}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                title="Fecha inicio"
              />
              <input
                type="date"
                name="fecha_fin"
                value={filtros.fecha_fin}
                onChange={handleFiltroChange}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                title="Fecha fin"
              />
              <select
                name="usuario_id"
                value={filtros.usuario_id}
                onChange={handleFiltroChange}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white max-w-[120px]"
              >
                <option value="">Todos</option>
                {asistencias.map((asist) => (
                  <option
                    key={asist.usuario_sistema_id}
                    value={asist.usuario_sistema_id}
                  >
                    {asist.usuario_sistema?.nombre_completo ||
                      asist.usuario_sistema?.nombre ||
                      "Sin nombre"}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  name="solo_activos"
                  checked={filtros.solo_activos}
                  onChange={handleFiltroChange}
                  className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  Activos
                </span>
              </label>
              <div className="flex gap-1 ml-auto">
                <button
                  onClick={aplicarFiltros}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Filtrar
                </button>
                <button
                  onClick={limpiarFiltros}
                  className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Limpiar
                </button>
                <button
                  onClick={generarReporteGeneral}
                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-1"
                  title="Generar Reporte General"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  PDF
                </button>
              </div>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <svg
                className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Tabla de asistencias */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Empleado
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Inicio
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Fin
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Horas
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Estado
                    </th>
                    <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-300 uppercase w-16">
                      •••
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {asistenciasFiltradas.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-3 py-6 text-center text-xs text-gray-500 dark:text-gray-400"
                      >
                        No hay registros
                      </td>
                    </tr>
                  ) : (
                    asistenciasFiltradas.map((asistencia) => {
                      const horas = calcularHorasTrabajadas(
                        asistencia.inicio_turno,
                        asistencia.finalizacion_turno
                      );
                      const isSelected =
                        empleadoSeleccionado?.id ===
                        asistencia.usuario_sistema_id;

                      return (
                        <tr
                          key={asistencia.id}
                          onClick={() =>
                            seleccionarEmpleadoDesdeAsistencia(asistencia)
                          }
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarColor(
                                  asistencia.usuario_sistema?.rol?.nombre
                                )} flex items-center justify-center text-white text-[8px] font-bold`}
                              >
                                {getIniciales(asistencia.usuario_sistema)}
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-900 dark:text-white">
                                  {asistencia.usuario_sistema
                                    ?.nombre_completo ||
                                    `${
                                      asistencia.usuario_sistema?.nombre || ""
                                    } ${
                                      asistencia.usuario_sistema
                                        ?.apellido_paterno || ""
                                    }`.trim()}
                                </div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {asistencia.usuario_sistema?.rol?.nombre ||
                                    "Doctor"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                            <div>{formatDate(asistencia.inicio_turno)}</div>
                            <div className="text-[10px] text-gray-500">
                              {formatTime(asistencia.inicio_turno)}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                            {asistencia.finalizacion_turno ? (
                              <>
                                <div>
                                  {formatDate(asistencia.finalizacion_turno)}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {formatTime(asistencia.finalizacion_turno)}
                                </div>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                            {horas > 0 ? `${horas.toFixed(1)}h` : "-"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span
                              className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                                asistencia.estado === "ASISTIO"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : asistencia.estado === "ATRASO"
                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                                  : asistencia.estado === "ATRASADO" ||
                                    asistencia.estado === "AUSENTE"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                  : asistencia.estado === "EN_TURNO"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              }`}
                            >
                              {asistencia.estado === "ASISTIO"
                                ? "OK"
                                : asistencia.estado === "ATRASO"
                                ? "OK con atraso"
                                : asistencia.estado === "ATRASADO"
                                ? "Atrasado"
                                : asistencia.estado === "AUSENTE"
                                ? "Ausente"
                                : asistencia.estado === "EN_TURNO"
                                ? "En turno"
                                : "Programado"}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="relative flex items-center justify-center">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuAbiertoId(
                                    menuAbiertoId === asistencia.id
                                      ? null
                                      : asistencia.id
                                  );
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                <svg
                                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <circle cx="12" cy="5" r="2" />
                                  <circle cx="12" cy="12" r="2" />
                                  <circle cx="12" cy="19" r="2" />
                                </svg>
                              </motion.button>

                              {/* Dropdown Menu */}
                              <AnimatePresence>
                                {menuAbiertoId === asistencia.id && (
                                  <motion.div
                                    initial={{
                                      opacity: 0,
                                      scale: 0.95,
                                      y: -10,
                                    }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{
                                      type: "spring",
                                      damping: 25,
                                      stiffness: 300,
                                    }}
                                    className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                        Acciones
                                      </p>
                                    </div>

                                    <div className="py-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          seleccionarEmpleadoDesdeAsistencia(
                                            asistencia
                                          );
                                          setMenuAbiertoId(null);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 transition-colors"
                                      >
                                        <svg
                                          className="w-4 h-4 text-blue-600"
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
                                        Ver Detalles
                                      </button>

                                      {!asistencia.finalizacion_turno && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            registrarSalida(asistencia.id);
                                            setMenuAbiertoId(null);
                                          }}
                                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-3 transition-colors"
                                        >
                                          <svg
                                            className="w-4 h-4 text-green-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                            />
                                          </svg>
                                          Registrar Salida
                                        </button>
                                      )}

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEdit(asistencia);
                                          setMenuAbiertoId(null);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 transition-colors"
                                      >
                                        <svg
                                          className="w-4 h-4 text-blue-600"
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
                                        Editar
                                      </button>

                                      <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(asistencia.id);
                                          setMenuAbiertoId(null);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                                      >
                                        <svg
                                          className="w-4 h-4 text-red-600"
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
                                        Eliminar
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Panel Derecho - 45% */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-[45%] bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
        >
          {empleadoSeleccionado && estadisticasEmpleado ? (
            <div className="flex flex-col h-full overflow-auto">
              {/* Header del empleado */}
              <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold`}
                  >
                    {getIniciales(empleadoSeleccionado)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">
                      {getEmpleadoNombre(empleadoSeleccionado)}
                    </h2>
                    <p className="text-blue-100">
                      {empleadoSeleccionado.especialidades &&
                      empleadoSeleccionado.especialidades.length > 0
                        ? empleadoSeleccionado.especialidades.join(", ")
                        : empleadoSeleccionado.rol?.nombre || "Doctor"}
                    </p>
                    <p className="text-sm text-blue-200 mt-1">
                      {formatearRUT(empleadoSeleccionado.rut)}
                    </p>
                  </div>
                  <button
                    onClick={() => setEmpleadoSeleccionado(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Info adicional */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="truncate">
                      {empleadoSeleccionado.email || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>{empleadoSeleccionado.celular || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Estadísticas del período */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                  Resumen del Período
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Esta Semana
                    </p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {estadisticasEmpleado.horasSemana.toFixed(1)}h
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {estadisticasEmpleado.diasSemana} días |{" "}
                      {estadisticasEmpleado.promedioSemana.toFixed(1)}h/día
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Este Mes
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {estadisticasEmpleado.horasMes.toFixed(1)}h
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {estadisticasEmpleado.diasMes} días |{" "}
                      {estadisticasEmpleado.promedioMes.toFixed(1)}h/día
                    </p>
                  </div>
                </div>
              </div>

              {/* Gráfico y Historial en grid */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  {/* Gráfico de barras */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">
                      Últimos 7 Días
                    </h3>
                    <div className="h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={estadisticasEmpleado.datosGrafico}
                          margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="dia"
                            tick={{ fontSize: 9 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 9 }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, "auto"]}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500">
                                      {payload[0].payload.fecha}
                                    </p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                      {payload[0].value}h
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="horas" radius={[3, 3, 0, 0]}>
                            {estadisticasEmpleado.datosGrafico.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={getBarColor(entry.horas)}
                                />
                              )
                            )}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Historial reciente */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">
                      Historial Reciente (30 días)
                    </h3>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {estadisticasEmpleado?.historialReciente &&
                      estadisticasEmpleado.historialReciente.length > 0 ? (
                        estadisticasEmpleado.historialReciente
                          .slice(0, 5)
                          .filter((a) => a.inicio_turno) // Filtrar registros sin fecha válida
                          .map((asistencia, idx) => {
                            const inicioDate = parseUTCDate(
                              asistencia.inicio_turno
                            );
                            const finDate = parseUTCDate(
                              asistencia.finalizacion_turno
                            );

                            const horasTrabajadas =
                              finDate && inicioDate
                                ? (finDate - inicioDate) / (1000 * 60 * 60)
                                : 0;

                            // Validar que inicio_turno sea una fecha válida
                            const esFechaValida =
                              inicioDate && !isNaN(inicioDate.getTime());

                            if (!esFechaValida) return null; // Saltar si la fecha no es válida

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded text-xs"
                              >
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {inicioDate.toLocaleDateString("es-CL", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </p>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                    {inicioDate.toLocaleTimeString("es-CL", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    -{" "}
                                    {finDate
                                      ? finDate.toLocaleTimeString("es-CL", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "-"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {horasTrabajadas > 0
                                      ? `${horasTrabajadas.toFixed(1)}h`
                                      : "-"}
                                  </p>
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                      asistencia.estado === "ASISTIO"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : asistencia.estado === "AUSENTE"
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    }`}
                                  >
                                    {asistencia.estado === "ASISTIO"
                                      ? "OK"
                                      : asistencia.estado === "AUSENTE"
                                      ? "Ausente"
                                      : "En curso"}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                          Haz clic en "Ver historial" para cargar los datos
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones de reporte */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                  Generar Reportes
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={generarReportePDF}
                    className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
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
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    PDF
                  </button>
                  <button
                    onClick={exportarExcel}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
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
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Excel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Estado inicial - Sin empleado seleccionado */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-32 h-32 mb-6 relative">
                {/* Ilustración médica */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full animate-pulse"></div>
                <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                {/* Iconos decorativos */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-green-500"
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
                <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Seleccione un Empleado
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                Haga clic en cualquier registro de la tabla para ver el detalle
                completo del empleado, estadísticas y generar reportes.
              </p>

              {/* Mini stats del día */}
              <div className="w-full max-w-sm bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Resumen del Día
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {
                        new Set(asistencias.map((a) => a.usuario_sistema_id))
                          .size
                      }
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Total Doctores
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {turnosActivos.length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      En Turno Ahora
                    </p>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <div className="mt-6 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Tip: Use los filtros para acotar el período de búsqueda
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
