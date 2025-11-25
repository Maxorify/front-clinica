import jsPDF from "jspdf";
import logoClinica from "../assets/clinic_oficial-removebg-preview.png";

/**
 * Formatea un RUT chileno al formato XX.XXX.XXX-X
 */
const formatearRUT = (rut) => {
  if (!rut) return "N/A";
  let rutLimpio = rut.toString().replace(/[^0-9kK]/g, "");
  const dv = rutLimpio.slice(-1);
  let rutNumeros = rutLimpio.slice(0, -1);
  rutNumeros = rutNumeros.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${rutNumeros}-${dv}`;
};

/**
 * Formatea una fecha al formato chileno
 */
const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

/**
 * Formatea hora desde datetime
 */
const formatearHora = (fecha) => {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

/**
 * Genera un reporte de asistencia individual en PDF
 */
export const generarReporteAsistenciaPDF = async ({ empleado, asistencias, fechaInicio, fechaFin, estadisticas }) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Colores corporativos
  const colorPrimario = [41, 128, 185];
  const colorSecundario = [52, 73, 94];
  const colorTexto = [44, 62, 80];
  const colorCeleste = [52, 152, 219];
  const colorVerde = [39, 174, 96];

  // ========== ENCABEZADO ==========

  // Línea superior decorativa
  doc.setFillColor(...colorCeleste);
  doc.rect(0, 0, pageWidth, 8, "F");

  yPos = 18;

  // Logo
  try {
    const img = new Image();
    img.src = logoClinica;

    await new Promise((resolve) => {
      img.onload = () => {
        doc.addImage(img, "PNG", 15, yPos, 35, 35);
        resolve();
      };
      img.onerror = resolve;
    });
  } catch (error) {
    console.error("Error al cargar logo:", error);
  }

  // Información de la clínica
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorPrimario);
  doc.text("MedSalud", 55, yPos + 5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text("Balmaceda 243, Laja", 55, yPos + 11);
  doc.text("+56 9 4557 2744", 55, yPos + 15);
  doc.text("contacto@med-salud.cl", 55, yPos + 19);

  // Título del reporte
  doc.setFillColor(...colorPrimario);
  doc.roundedRect(125, yPos, 70, 30, 2, 2, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("REPORTE DE", 160, yPos + 10, { align: "center" });
  doc.text("ASISTENCIA", 160, yPos + 18, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${formatearFecha(fechaInicio)} - ${formatearFecha(fechaFin)}`, 160, yPos + 25, { align: "center" });

  yPos = 60;

  // Línea separadora
  doc.setDrawColor(...colorCeleste);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 10;

  // ========== DATOS DEL EMPLEADO ==========
  doc.setFillColor(...colorPrimario);
  doc.rect(15, yPos - 2, 90, 7, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DATOS DEL EMPLEADO", 17, yPos + 3);

  yPos += 12;

  const nombreCompleto = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno || ""}`.trim();

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorSecundario);
  doc.text("NOMBRE:", 17, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text(nombreCompleto, 40, yPos);

  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorSecundario);
  doc.text("RUT:", 17, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text(formatearRUT(empleado.rut), 40, yPos);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorSecundario);
  doc.text("ROL:", 100, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text(empleado.rol?.nombre || "N/A", 115, yPos);

  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorSecundario);
  doc.text("EMAIL:", 17, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text(empleado.email || "N/A", 40, yPos);

  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorSecundario);
  doc.text("TELÉFONO:", 17, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text(empleado.celular || "N/A", 40, yPos);

  yPos += 12;

  // ========== RESUMEN DEL PERÍODO ==========
  doc.setFillColor(...colorPrimario);
  doc.rect(15, yPos - 2, 90, 7, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("RESUMEN DEL PERÍODO", 17, yPos + 3);

  yPos += 12;

  // Grid de estadísticas
  const stats = [
    { label: "Total Horas", value: `${estadisticas.totalHoras.toFixed(2)} hrs` },
    { label: "Días Trabajados", value: estadisticas.diasTrabajados.toString() },
    { label: "Promedio Diario", value: `${estadisticas.promedioDiario.toFixed(2)} hrs` },
    { label: "Turnos Completos", value: estadisticas.turnosCompletos.toString() },
    { label: "Turnos Incompletos", value: estadisticas.turnosIncompletos.toString() },
  ];

  // Dibujar estadísticas en dos columnas
  stats.forEach((stat, index) => {
    const xOffset = index % 2 === 0 ? 17 : 100;
    const currentY = yPos + Math.floor(index / 2) * 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colorSecundario);
    doc.text(`${stat.label}:`, xOffset, currentY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colorVerde);
    doc.text(stat.value, xOffset + 35, currentY);
  });

  yPos += Math.ceil(stats.length / 2) * 6 + 10;

  // ========== DETALLE DE ASISTENCIAS ==========
  doc.setFillColor(...colorPrimario);
  doc.rect(15, yPos - 2, pageWidth - 30, 7, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DETALLE DE ASISTENCIAS", 17, yPos + 3);

  yPos += 12;

  // Encabezados de la tabla
  doc.setFillColor(...colorCeleste);
  doc.rect(15, yPos - 5, pageWidth - 30, 8, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("FECHA", 17, yPos);
  doc.text("ENTRADA", 50, yPos);
  doc.text("SALIDA", 80, yPos);
  doc.text("HORAS", 110, yPos);
  doc.text("ESTADO", 140, yPos);

  yPos += 8;

  // Filas de asistencias
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.setFontSize(8);

  asistencias.forEach((asistencia, index) => {
    // Nueva página si es necesario
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;

      // Re-dibujar encabezados
      doc.setFillColor(...colorCeleste);
      doc.rect(15, yPos - 5, pageWidth - 30, 8, "F");

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("FECHA", 17, yPos);
      doc.text("ENTRADA", 50, yPos);
      doc.text("SALIDA", 80, yPos);
      doc.text("HORAS", 110, yPos);
      doc.text("ESTADO", 140, yPos);

      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colorTexto);
    }

    // Alternar color de fondo
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(15, yPos - 4, pageWidth - 30, 7, "F");
    }

    const fecha = formatearFecha(asistencia.inicio_turno);
    const entrada = formatearHora(asistencia.inicio_turno);
    const salida = asistencia.finalizacion_turno ? formatearHora(asistencia.finalizacion_turno) : "-";

    let horas = "-";
    if (asistencia.inicio_turno && asistencia.finalizacion_turno) {
      const diff = (new Date(asistencia.finalizacion_turno) - new Date(asistencia.inicio_turno)) / 1000 / 60 / 60;
      horas = `${diff.toFixed(2)}`;
    }

    const estado = asistencia.finalizacion_turno ? "Completo" : "En turno";

    doc.setTextColor(...colorTexto);
    doc.text(fecha, 17, yPos);
    doc.text(entrada, 50, yPos);
    doc.text(salida, 80, yPos);
    doc.text(horas, 110, yPos);

    // Color del estado
    if (estado === "Completo") {
      doc.setTextColor(...colorVerde);
    } else {
      doc.setTextColor(241, 196, 15);
    }
    doc.text(estado, 140, yPos);

    yPos += 7;
  });

  // ========== PIE DE PÁGINA ==========
  yPos = pageHeight - 25;

  doc.setDrawColor(...colorCeleste);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text("Este documento es un reporte oficial de asistencia", pageWidth / 2, yPos, { align: "center" });

  yPos += 4;
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 120);
  const fechaGeneracion = new Date().toLocaleDateString("es-CL");
  const horaGeneracion = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  doc.text(`Generado: ${fechaGeneracion} ${horaGeneracion} - Sistema MedSalud`, pageWidth / 2, yPos, { align: "center" });

  // Línea inferior decorativa
  doc.setFillColor(...colorCeleste);
  doc.rect(0, pageHeight - 8, pageWidth, 8, "F");

  // Abrir PDF
  const nombreArchivo = `Reporte_Asistencia_${empleado.apellido_paterno}_${fechaInicio}_${fechaFin}.pdf`;
  doc.output('dataurlnewwindow', { filename: nombreArchivo });
};

/**
 * Genera un reporte general de asistencia del equipo
 */
export const generarReporteGeneralPDF = async ({ asistencias, empleados, fechaInicio, fechaFin, estadisticasGenerales }) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Colores corporativos
  const colorPrimario = [41, 128, 185];
  const colorSecundario = [52, 73, 94];
  const colorTexto = [44, 62, 80];
  const colorCeleste = [52, 152, 219];
  const colorVerde = [39, 174, 96];

  // ========== ENCABEZADO ==========
  doc.setFillColor(...colorCeleste);
  doc.rect(0, 0, pageWidth, 8, "F");

  yPos = 18;

  // Logo
  try {
    const img = new Image();
    img.src = logoClinica;

    await new Promise((resolve) => {
      img.onload = () => {
        doc.addImage(img, "PNG", 15, yPos, 35, 35);
        resolve();
      };
      img.onerror = resolve;
    });
  } catch (error) {
    console.error("Error al cargar logo:", error);
  }

  // Información de la clínica
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorPrimario);
  doc.text("MedSalud", 55, yPos + 5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text("Balmaceda 243, Laja", 55, yPos + 11);
  doc.text("+56 9 4557 2744", 55, yPos + 15);

  // Título
  doc.setFillColor(...colorPrimario);
  doc.roundedRect(120, yPos, 75, 30, 2, 2, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("REPORTE GENERAL", 157.5, yPos + 10, { align: "center" });
  doc.text("DE ASISTENCIA", 157.5, yPos + 18, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${formatearFecha(fechaInicio)} - ${formatearFecha(fechaFin)}`, 157.5, yPos + 25, { align: "center" });

  yPos = 60;

  doc.setDrawColor(...colorCeleste);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 10;

  // ========== RESUMEN GENERAL ==========
  doc.setFillColor(...colorPrimario);
  doc.rect(15, yPos - 2, 90, 7, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("RESUMEN GENERAL", 17, yPos + 3);

  yPos += 12;

  const statsGenerales = [
    { label: "Total Empleados", value: estadisticasGenerales.totalEmpleados.toString() },
    { label: "Total Horas Equipo", value: `${estadisticasGenerales.totalHorasEquipo.toFixed(2)} hrs` },
    { label: "Promedio por Empleado", value: `${estadisticasGenerales.promedioHorasPorEmpleado.toFixed(2)} hrs` },
    { label: "Turnos Registrados", value: estadisticasGenerales.totalTurnos.toString() },
  ];

  statsGenerales.forEach((stat, index) => {
    const xOffset = index % 2 === 0 ? 17 : 100;
    const currentY = yPos + Math.floor(index / 2) * 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colorSecundario);
    doc.text(`${stat.label}:`, xOffset, currentY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colorVerde);
    doc.text(stat.value, xOffset + 40, currentY);
  });

  yPos += Math.ceil(statsGenerales.length / 2) * 6 + 10;

  // ========== RANKING POR HORAS ==========
  doc.setFillColor(...colorPrimario);
  doc.rect(15, yPos - 2, pageWidth - 30, 7, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("RANKING POR HORAS TRABAJADAS", 17, yPos + 3);

  yPos += 12;

  // Encabezados
  doc.setFillColor(...colorCeleste);
  doc.rect(15, yPos - 5, pageWidth - 30, 8, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("#", 17, yPos);
  doc.text("EMPLEADO", 25, yPos);
  doc.text("ROL", 90, yPos);
  doc.text("HORAS", 130, yPos);
  doc.text("TURNOS", 160, yPos);

  yPos += 8;

  // Ordenar empleados por horas
  const ranking = estadisticasGenerales.rankingEmpleados || [];

  ranking.slice(0, 15).forEach((emp, index) => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(15, yPos - 4, pageWidth - 30, 7, "F");
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colorTexto);

    doc.text(`${index + 1}`, 17, yPos);
    doc.text(emp.nombre.substring(0, 35), 25, yPos);
    doc.text(emp.rol || "N/A", 90, yPos);
    doc.setTextColor(...colorVerde);
    doc.text(`${emp.horas.toFixed(2)}`, 130, yPos);
    doc.setTextColor(...colorTexto);
    doc.text(`${emp.turnos}`, 160, yPos);

    yPos += 7;
  });

  // ========== PIE DE PÁGINA ==========
  yPos = pageHeight - 25;

  doc.setDrawColor(...colorCeleste);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text("Reporte oficial de asistencia del equipo", pageWidth / 2, yPos, { align: "center" });

  yPos += 4;
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 120);
  const fechaGeneracion = new Date().toLocaleDateString("es-CL");
  const horaGeneracion = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  doc.text(`Generado: ${fechaGeneracion} ${horaGeneracion} - Sistema MedSalud`, pageWidth / 2, yPos, { align: "center" });

  doc.setFillColor(...colorCeleste);
  doc.rect(0, pageHeight - 8, pageWidth, 8, "F");

  const nombreArchivo = `Reporte_General_Asistencia_${fechaInicio}_${fechaFin}.pdf`;
  doc.output('dataurlnewwindow', { filename: nombreArchivo });
};
