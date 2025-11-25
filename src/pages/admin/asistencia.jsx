/**
 * MÓDULO PROFESIONAL DE ASISTENCIA DE DOCTORES
 *
 * Características:
 * - Usa API nueva con vista consolidada
 * - Estadísticas calculadas automáticamente
 * - Marcas de asistencia con trazabilidad
 * - Justificaciones de ausencias/atrasos
 * - Exportación PDF/Excel con datos reales
 * - Actualización automática cada 30s
 * - Estados: ASISTIO, ATRASO, AUSENTE, JUSTIFICADO, PARCIAL, EN_TURNO
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import * as XLSX from "xlsx";
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

// Mapeo de colores por estado
const ESTADO_COLORS = {
  PROGRAMADO: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300",
  EN_TURNO: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  ASISTIO: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ATRASO: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  AUSENTE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  JUSTIFICADO: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  PARCIAL: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function AsistenciaProfesional() {
  // Estados principales
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [resumenDia, setResumenDia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notification, setNotification] = useState(null);

  // Estados para modales
  const [showMarcaModal, setShowMarcaModal] = useState(false);
  const [showJustificacionModal, setShowJustificacionModal] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [doctorSeleccionado, setDoctorSeleccionado] = useState(null);

  // Estados para formularios
  const [formMarca, setFormMarca] = useState({
    usuario_sistema_id: "",
    tipo_marca: "ENTRADA",
    fecha_hora_marca: "",
    fuente: "MANUAL",
    registrado_por: localStorage.getItem("user_id") || "",
    notas: "",
  });

  const [formJustificacion, setFormJustificacion] = useState({
    tipo_justificacion: "PERMISO_MEDICO",
    justificacion: "",
    justificado_por: localStorage.getItem("user_id") || "",
  });

  // Cargar datos al montar y cada 30s si autoRefresh está activo
  useEffect(() => {
    cargarTurnosDia();

    if (autoRefresh) {
      const interval = setInterval(cargarTurnosDia, 30000); // 30 segundos
      return () => clearInterval(interval);
    }
  }, [fechaSeleccionada, autoRefresh]);

  // Limpiar notificaciones
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const showNotification = (type, message) => {
    setNotification({ id: Date.now(), type, message });
  };

  // ============================================================================
  // FUNCIÓN PRINCIPAL: Cargar turnos del día con API nueva
  // ============================================================================
  const cargarTurnosDia = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/asistencia/turnos-dia`, {
        params: { fecha: fechaSeleccionada },
      });

      setResumenDia(response.data);
      console.log("✅ Datos cargados:", response.data);
    } catch (error) {
      console.error("❌ Error al cargar turnos:", error);
      if (error.response?.status !== 404) {
        showNotification("error", "Error al cargar turnos del día");
      }
      setResumenDia({
        fecha: fechaSeleccionada,
        total_turnos: 0,
        en_turno: 0,
        asistieron: 0,
        con_atraso: 0,
        ausentes: 0,
        justificados: 0,
        turnos: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // REGISTRAR MARCA MANUAL
  // ============================================================================
  const handleRegistrarMarca = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/asistencia/marcar-manual`, {
        usuario_sistema_id: parseInt(formMarca.usuario_sistema_id),
        tipo_marca: formMarca.tipo_marca,
        fecha_hora_marca: formMarca.fecha_hora_marca || null,
        fuente: formMarca.fuente,
        registrado_por: parseInt(formMarca.registrado_por),
        notas: formMarca.notas || null,
      });

      showNotification("success", "Marca registrada exitosamente");
      setShowMarcaModal(false);
      resetFormMarca();
      await cargarTurnosDia();
    } catch (error) {
      console.error("Error al registrar marca:", error);
      showNotification(
        "error",
        error.response?.data?.detail || "Error al registrar marca"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // JUSTIFICAR AUSENCIA/ATRASO
  // ============================================================================
  const handleJustificar = async (e) => {
    e.preventDefault();
    if (!turnoSeleccionado) return;

    setLoading(true);

    try {
      await axios.post(
        `${API_URL}/asistencia/asistencia/${turnoSeleccionado.id}/justificar`,
        {
          tipo_justificacion: formJustificacion.tipo_justificacion,
          justificacion: formJustificacion.justificacion,
          justificado_por: parseInt(formJustificacion.justificado_por),
        }
      );

      showNotification("success", "Ausencia/atraso justificado exitosamente");
      setShowJustificacionModal(false);
      resetFormJustificacion();
      setTurnoSeleccionado(null);
      await cargarTurnosDia();
    } catch (error) {
      console.error("Error al justificar:", error);
      showNotification(
        "error",
        error.response?.data?.detail || "Error al justificar"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // VER HISTORIAL DE DOCTOR
  // ============================================================================
  const verHistorialDoctor = async (doctorId) => {
    try {
      const response = await axios.get(
        `${API_URL}/asistencia/doctor/${doctorId}/historial-diario`,
        {
          params: {
            fecha_desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            fecha_hasta: fechaSeleccionada,
            limit: 30,
          },
        }
      );

      const doctor = resumenDia.turnos.find(
        (t) => t.doctor.id === doctorId
      )?.doctor;
      setDoctorSeleccionado({ ...doctor, historial: response.data.historial });
    } catch (error) {
      console.error("Error al cargar historial:", error);
      showNotification("error", "Error al cargar historial del doctor");
    }
  };

  // ============================================================================
  // EXPORTAR PDF INDIVIDUAL
  // ============================================================================
  const exportarPDFDoctor = async (doctorId) => {
    try {
      const [historialRes, estadisticasRes] = await Promise.all([
        axios.get(`${API_URL}/asistencia/doctor/${doctorId}/historial-diario`, {
          params: {
            fecha_desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            fecha_hasta: fechaSeleccionada,
          },
        }),
        axios.get(`${API_URL}/asistencia/doctor/${doctorId}/estadisticas`, {
          params: {
            fecha_desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            fecha_hasta: fechaSeleccionada,
          },
        }),
      ]);

      const doctor = resumenDia.turnos.find(
        (t) => t.doctor.id === doctorId
      )?.doctor;

      await generarReporteAsistenciaPDF({
        empleado: {
          nombre: doctor.nombre,
          apellido_paterno: doctor.apellido_paterno,
          apellido_materno: doctor.apellido_materno,
          rut: doctor.rut,
          email: doctor.email || "",
          rol: { nombre: "Doctor" },
        },
        asistencias: historialRes.data.historial,
        fechaInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        fechaFin: fechaSeleccionada,
        estadisticas: {
          totalHoras: estadisticasRes.data.total_minutos_trabajados / 60,
          diasTrabajados:
            estadisticasRes.data.dias_asistio +
            estadisticasRes.data.dias_atraso,
          promedioDiario:
            estadisticasRes.data.total_minutos_trabajados /
            60 /
            estadisticasRes.data.total_turnos,
          turnosCompletos: estadisticasRes.data.dias_asistio,
          turnosIncompletos:
            estadisticasRes.data.dias_atraso +
            estadisticasRes.data.dias_ausente,
        },
      });

      showNotification("success", "PDF generado exitosamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showNotification("error", "Error al generar el PDF");
    }
  };

  // ============================================================================
  // EXPORTAR EXCEL INDIVIDUAL
  // ============================================================================
  const exportarExcelDoctor = async (doctorId) => {
    try {
      const response = await axios.get(
        `${API_URL}/asistencia/doctor/${doctorId}/historial-diario`,
        {
          params: {
            fecha_desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            fecha_hasta: fechaSeleccionada,
          },
        }
      );

      const doctor = resumenDia.turnos.find(
        (t) => t.doctor.id === doctorId
      )?.doctor;

      const datos = response.data.historial.map((h) => ({
        Fecha: new Date(h.fecha).toLocaleDateString("es-CL"),
        "Hora Entrada": h.entrada_real
          ? new Date(h.entrada_real).toLocaleTimeString("es-CL")
          : "-",
        "Hora Salida": h.salida_real
          ? new Date(h.salida_real).toLocaleTimeString("es-CL")
          : "-",
        Estado: h.estado_dia,
        "Minutos Atraso": h.minutos_atraso || 0,
        "Minutos Trabajados": h.entrada_real && h.salida_real ? Math.round((new Date(h.salida_real) - new Date(h.entrada_real)) / (1000 * 60)) : 0,
        "Pacientes Agendados": h.pacientes?.agendados || 0,
        "Pacientes Atendidos": h.pacientes?.atendidos || 0,
        Justificación: h.justificacion || "",
      }));

      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Asistencia");

      const nombreArchivo = `Asistencia_${doctor.nombre}_${doctor.apellido_paterno}_${fechaSeleccionada}.xlsx`;
      XLSX.writeFile(wb, nombreArchivo);

      showNotification("success", "Excel generado exitosamente");
    } catch (error) {
      console.error("Error al generar Excel:", error);
      showNotification("error", "Error al generar el Excel");
    }
  };

  // ============================================================================
  // EXPORTAR PDF GENERAL
  // ============================================================================
  const exportarPDFGeneral = async () => {
    try {
      await generarReporteGeneralPDF({
        asistencias: resumenDia.turnos,
        empleados: resumenDia.turnos.map((t) => t.doctor),
        fechaInicio: fechaSeleccionada,
        fechaFin: fechaSeleccionada,
        estadisticasGenerales: {
          totalEmpleados: resumenDia.total_turnos,
          totalHorasEquipo:
            resumenDia.turnos.reduce(
              (sum, t) => sum + (t.minutos_trabajados || 0),
              0
            ) / 60,
          promedioHorasPorEmpleado:
            resumenDia.turnos.reduce(
              (sum, t) => sum + (t.minutos_trabajados || 0),
              0
            ) /
            60 /
            (resumenDia.total_turnos || 1),
          totalTurnos: resumenDia.total_turnos,
          rankingEmpleados: resumenDia.turnos
            .map((t) => ({
              nombre: t.doctor.nombre_completo,
              rol: "Doctor",
              horas: (t.minutos_trabajados || 0) / 60,
              turnos: 1,
            }))
            .sort((a, b) => b.horas - a.horas),
        },
      });

      showNotification("success", "PDF general generado exitosamente");
    } catch (error) {
      console.error("Error al generar PDF general:", error);
      showNotification("error", "Error al generar el PDF general");
    }
  };

  // Helpers
  const resetFormMarca = () => {
    setFormMarca({
      usuario_sistema_id: "",
      tipo_marca: "ENTRADA",
      fecha_hora_marca: "",
      fuente: "MANUAL",
      registrado_por: localStorage.getItem("user_id") || "",
      notas: "",
    });
  };

  const resetFormJustificacion = () => {
    setFormJustificacion({
      tipo_justificacion: "PERMISO_MEDICO",
      justificacion: "",
      justificado_por: localStorage.getItem("user_id") || "",
    });
  };

  const formatTime = (datetime) => {
    if (!datetime) return "-";
    return new Date(datetime).toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (datetime) => {
    if (!datetime) return "-";
    return new Date(datetime).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const getIniciales = (doctor) => {
    const nombre = doctor.nombre?.charAt(0) || "";
    const apellido = doctor.apellido_paterno?.charAt(0) || "";
    return `${nombre}${apellido}`.toUpperCase();
  };

  const getEstadoBadgeClass = (estado) => {
    return ESTADO_COLORS[estado] || "bg-gray-100 text-gray-800";
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

      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Asistencia de Doctores
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Control profesional con marcas y estados calculados
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                autoRefresh
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {autoRefresh ? "🔄 Auto 30s" : "⏸️ Pausado"}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        {resumenDia && (
          <div className="grid grid-cols-6 gap-3 mb-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-2.5 text-white">
              <p className="text-xs font-medium opacity-90">Total Turnos</p>
              <p className="text-2xl font-bold">{resumenDia.total_turnos}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-2.5 text-white">
              <p className="text-xs font-medium opacity-90">En Turno</p>
              <p className="text-2xl font-bold">{resumenDia.en_turno}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-2.5 text-white">
              <p className="text-xs font-medium opacity-90">Asistieron</p>
              <p className="text-2xl font-bold">{resumenDia.asistieron}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow p-2.5 text-white">
              <p className="text-xs font-medium opacity-90">Con Atraso</p>
              <p className="text-2xl font-bold">{resumenDia.con_atraso}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow p-2.5 text-white">
              <p className="text-xs font-medium opacity-90">Ausentes</p>
              <p className="text-2xl font-bold">{resumenDia.ausentes}</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow p-2.5 text-white">
              <p className="text-xs font-medium opacity-90">Justificados</p>
              <p className="text-2xl font-bold">{resumenDia.justificados}</p>
            </div>
          </div>
        )}
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex gap-4 px-6 pb-4 overflow-hidden">
        {/* Panel izquierdo - Lista de turnos */}
        <div className="w-[60%] flex flex-col gap-3">
          {/* Controles */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowMarcaModal(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Marcar Manual
            </button>
            <button
              onClick={exportarPDFGeneral}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              PDF General
            </button>
            <button
              onClick={cargarTurnosDia}
              disabled={loading}
              className="ml-auto px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
            >
              {loading ? "🔄 Cargando..." : "↻ Actualizar"}
            </button>
          </div>

          {/* Tabla de turnos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Doctor
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Turno
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Entrada
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Salida
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Atraso
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Estado
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Pacientes
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {!resumenDia || resumenDia.turnos.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        {loading
                          ? "Cargando turnos..."
                          : "No hay turnos registrados para esta fecha"}
                      </td>
                    </tr>
                  ) : (
                    resumenDia.turnos.map((turno) => (
                      <tr
                        key={turno.id}
                        onClick={() => verHistorialDoctor(turno.doctor.id)}
                        className={`cursor-pointer transition-colors ${
                          doctorSeleccionado?.id === turno.doctor.id
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                              {getIniciales(turno.doctor)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {turno.doctor.nombre_completo}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {turno.doctor.especialidades?.join(", ") ||
                                  "Sin especialidad"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatTime(turno.inicio_turno)} -{" "}
                          {formatTime(turno.finalizacion_turno)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatTime(turno.marca_entrada)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatTime(turno.marca_salida)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {turno.minutos_atraso > 0
                            ? `${turno.minutos_atraso} min`
                            : "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getEstadoBadgeClass(
                              turno.estado_asistencia
                            )}`}
                          >
                            {turno.estado_asistencia}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {turno.pacientes_atendidos}/
                          {turno.pacientes_agendados}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(turno.estado_asistencia === "AUSENTE" ||
                              turno.estado_asistencia === "ATRASO") && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTurnoSeleccionado(turno);
                                  setShowJustificacionModal(true);
                                }}
                                className="p-1 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded"
                                title="Justificar"
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
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                exportarPDFDoctor(turno.doctor.id);
                              }}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                              title="PDF"
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
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                exportarExcelDoctor(turno.doctor.id);
                              }}
                              className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                              title="Excel"
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
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Panel derecho - Detalle del doctor */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-[40%] bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
        >
          {doctorSeleccionado ? (
            <>
              <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
                    {getIniciales(doctorSeleccionado)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">
                      {doctorSeleccionado.nombre_completo}
                    </h2>
                    <p className="text-blue-100">
                      {doctorSeleccionado.especialidades?.join(", ") ||
                        "Sin especialidad"}
                    </p>
                    <p className="text-sm text-blue-200 mt-1">
                      {doctorSeleccionado.rut || "Sin RUT"}
                    </p>
                  </div>
                  <button
                    onClick={() => setDoctorSeleccionado(null)}
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
              </div>

              <div className="flex-1 overflow-auto p-4">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                  Historial Reciente (30 días)
                </h3>
                <div className="space-y-2">
                  {doctorSeleccionado.historial &&
                  doctorSeleccionado.historial.length > 0 ? (
                    doctorSeleccionado.historial.map((h, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(h.fecha).toLocaleDateString(
                              "es-CL"
                            )}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${getEstadoBadgeClass(
                              h.estado_dia
                            )}`}
                          >
                            {h.estado_dia}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <div>
                            Entrada:{" "}
                            {h.entrada_real
                              ? formatTime(h.entrada_real)
                              : "-"}
                          </div>
                          <div>
                            Salida:{" "}
                            {h.salida_real ? formatTime(h.salida_real) : "-"}
                          </div>
                          <div>Atraso: {h.minutos_atraso || 0} min</div>
                          <div>
                            Trabajados:{" "}
                            {Math.floor((h.minutos_trabajados || 0) / 60)}h{" "}
                            {(h.minutos_trabajados || 0) % 60}m
                          </div>
                        </div>
                        {h.justificacion && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                            <strong>Justificación:</strong> {h.justificacion}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      Sin historial disponible
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 mb-4 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center">
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
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Seleccione un Doctor
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                Haga clic en cualquier turno para ver el historial completo y
                generar reportes
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal Marca Manual */}
      <AnimatePresence>
        {showMarcaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowMarcaModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Registrar Marca Manual
                </h2>
                <button
                  onClick={() => setShowMarcaModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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

              <form onSubmit={handleRegistrarMarca} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Doctor *
                  </label>
                  <select
                    value={formMarca.usuario_sistema_id}
                    onChange={(e) =>
                      setFormMarca({
                        ...formMarca,
                        usuario_sistema_id: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Seleccionar doctor</option>
                    {resumenDia?.turnos.map((t) => (
                      <option key={t.doctor.id} value={t.doctor.id}>
                        {t.doctor.nombre_completo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Marca *
                  </label>
                  <select
                    value={formMarca.tipo_marca}
                    onChange={(e) =>
                      setFormMarca({ ...formMarca, tipo_marca: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="ENTRADA">Entrada</option>
                    <option value="SALIDA">Salida</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha y Hora (opcional, usa hora actual si se omite)
                  </label>
                  <input
                    type="datetime-local"
                    value={formMarca.fecha_hora_marca}
                    onChange={(e) =>
                      setFormMarca({
                        ...formMarca,
                        fecha_hora_marca: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={formMarca.notas}
                    onChange={(e) =>
                      setFormMarca({ ...formMarca, notas: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ej: Biométrico no funcionó, registro manual"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMarcaModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    {loading ? "Guardando..." : "Registrar Marca"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Justificación */}
      <AnimatePresence>
        {showJustificacionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowJustificacionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Justificar Ausencia/Atraso
                </h2>
                <button
                  onClick={() => setShowJustificacionModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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

              <form onSubmit={handleJustificar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Justificación *
                  </label>
                  <select
                    value={formJustificacion.tipo_justificacion}
                    onChange={(e) =>
                      setFormJustificacion({
                        ...formJustificacion,
                        tipo_justificacion: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="PERMISO_MEDICO">Permiso Médico</option>
                    <option value="REUNION_INSTITUCIONAL">
                      Reunión Institucional
                    </option>
                    <option value="EMERGENCIA_FAMILIAR">
                      Emergencia Familiar
                    </option>
                    <option value="CAPACITACION">Capacitación</option>
                    <option value="LICENCIA_MEDICA">Licencia Médica</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Justificación *
                  </label>
                  <textarea
                    value={formJustificacion.justificacion}
                    onChange={(e) =>
                      setFormJustificacion({
                        ...formJustificacion,
                        justificacion: e.target.value,
                      })
                    }
                    required
                    minLength={10}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Describa el motivo de la ausencia o atraso..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowJustificacionModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-yellow-300"
                  >
                    {loading ? "Guardando..." : "Justificar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

