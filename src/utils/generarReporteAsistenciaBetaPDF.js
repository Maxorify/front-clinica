import jsPDF from "jspdf";
import logoClinica from "../assets/clinic_oficial-removebg-preview.png";
import axios from "axios";

const API_URL = "http://localhost:5000";

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
    year: "numeric",
    timeZone: "America/Santiago"
  });
};

/**
 * Formatea hora desde datetime
 */
const formatearHora = (fecha) => {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago"
  });
};

/**
 * REPORTE BETA v2.0 - CON MÉTRICAS PROFESIONALES
 * Incluye: Productividad clínica, ingresos, especialidades, cumplimiento
 */
export const generarReporteAsistenciaBetaPDF = async ({ empleado, asistencias, fechaInicio, fechaFin, estadisticas }) => {
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
  const colorNaranja = [243, 156, 18];
  const colorMorado = [155, 89, 182];

  // ===== OBTENER DATOS ADICIONALES DE PRODUCTIVIDAD =====
  let datosProductividad = {
    citasAtendidas: 0,
    citasProgramadas: 0,
    ingresosTotales: 0,
    especialidades: {},
    citasPorDia: {},
    horasProgramadas: 0
  };
  
  let distribucionEspecialidades = [];

  try {
    // IMPORTANTE: Este reporte muestra datos del MES COMPLETO, no del rango de fechas
    // OPTIMIZACIÓN: Una sola llamada al backend en lugar de 31 llamadas (una por día)
    
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const añoActual = ahora.getFullYear();

    // OPTIMIZACIÓN: Una sola llamada al backend
    const productividadResponse = await axios.get(
      `${API_URL}/Citas/doctor/${empleado.id}/productividad-mensual`,
      {
        params: {
          mes: mesActual,
          anio: añoActual
        }
      }
    );

    if (productividadResponse.data) {
      const { citas, resumen } = productividadResponse.data;
      
      // Asignar datos directamente del resumen optimizado
      datosProductividad.citasProgramadas = resumen.total_citas;
      datosProductividad.citasAtendidas = resumen.citas_completadas;
      datosProductividad.ingresosTotales = resumen.total_ingresos;
      
      // Convertir especialidades de objeto a array para distribución
      distribucionEspecialidades = Object.entries(resumen.especialidades).map(([nombre, cantidad]) => ({
        nombre,
        consultas: cantidad
      }));
    }

    // Calcular horas programadas (10% más que trabajadas como estimación)
    datosProductividad.horasProgramadas = estadisticas.totalHoras * 1.1;

  } catch (error) {
    console.warn("Error obteniendo datos de productividad:", error);
  }

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
  doc.text("contacto@med-salud.cl", 55, yPos + 19);

  // Título del reporte
  doc.setFillColor(...colorMorado);
  doc.roundedRect(115, yPos, 80, 35, 2, 2, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("REPORTE PROFESIONAL", 155, yPos + 9, { align: "center" });
  doc.text("DE ASISTENCIA", 155, yPos + 16, { align: "center" });
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("BETA v2.0", 155, yPos + 23, { align: "center" });

  doc.setFontSize(8);
  doc.text(`${formatearFecha(fechaInicio)} - ${formatearFecha(fechaFin)}`, 155, yPos + 30, { align: "center" });

  yPos = 60;

  // Línea separadora
  doc.setDrawColor(...colorCeleste);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 10;

  // ========== RESUMEN EJECUTIVO (KPIs GRANDES) ==========
  doc.setFillColor(...colorPrimario);
  doc.rect(15, yPos - 2, pageWidth - 30, 7, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("RESUMEN EJECUTIVO", 17, yPos + 3);

  yPos += 12;

  // Grid de KPIs principales (3 columnas)
  const kpis = [
    { 
      label: "Horas Trabajadas", 
      value: `${estadisticas.totalHoras.toFixed(1)} hrs`,
      color: colorVerde
    },
    { 
      label: "Pacientes Atendidos", 
      value: datosProductividad.citasAtendidas.toString(),
      color: colorCeleste
    },
    { 
      label: "Ingresos Generados", 
      value: `$${datosProductividad.ingresosTotales.toLocaleString('es-CL')}`,
      color: colorNaranja
    }
  ];

  const kpiWidth = (pageWidth - 40) / 3;
  kpis.forEach((kpi, index) => {
    const xPos = 17 + (index * kpiWidth);
    
    // Fondo del KPI
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(xPos, yPos, kpiWidth - 3, 20, 2, 2, "F");
    
    // Valor grande
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, xPos + (kpiWidth - 3) / 2, yPos + 10, { align: "center" });
    
    // Label pequeño
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colorSecundario);
    doc.text(kpi.label, xPos + (kpiWidth - 3) / 2, yPos + 16, { align: "center" });
  });

  yPos += 28;

  // ========== PRODUCTIVIDAD CLÍNICA ==========
  doc.setFillColor(...colorPrimario);
  doc.rect(15, yPos - 2, pageWidth - 30, 7, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("PRODUCTIVIDAD CLÍNICA", 17, yPos + 3);

  yPos += 12;

  // Métricas de productividad en 2 columnas
  const tasaAtencion = datosProductividad.citasProgramadas > 0 
    ? (datosProductividad.citasAtendidas / datosProductividad.citasProgramadas * 100).toFixed(1)
    : 0;
  
  const pacientesPorHora = estadisticas.totalHoras > 0
    ? (datosProductividad.citasAtendidas / estadisticas.totalHoras).toFixed(2)
    : 0;

  const ingresoPorHora = estadisticas.totalHoras > 0
    ? (datosProductividad.ingresosTotales / estadisticas.totalHoras).toFixed(0)
    : 0;

  const metricas = [
    { label: "Citas Programadas", value: datosProductividad.citasProgramadas.toString() },
    { label: "Citas Atendidas", value: datosProductividad.citasAtendidas.toString() },
    { label: "Tasa de Atención", value: `${tasaAtencion}%` },
    { label: "Pacientes/Hora", value: pacientesPorHora },
    { label: "Ingreso/Hora", value: `$${parseFloat(ingresoPorHora).toLocaleString('es-CL')}` },
    { label: "Promedio/Consulta", value: datosProductividad.citasAtendidas > 0 
      ? `$${(datosProductividad.ingresosTotales / datosProductividad.citasAtendidas).toFixed(0).toLocaleString('es-CL')}`
      : '$0'
    },
  ];

  metricas.forEach((metrica, index) => {
    const xOffset = index % 2 === 0 ? 17 : 110;
    const currentY = yPos + Math.floor(index / 2) * 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colorSecundario);
    doc.text(`${metrica.label}:`, xOffset, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colorVerde);
    doc.text(metrica.value, xOffset + 45, currentY);
  });

  yPos += Math.ceil(metricas.length / 2) * 6 + 8;

  // Semáforo de desempeño
  let desempeno = "Bajo";
  let colorDesempeno = [231, 76, 60]; // Rojo
  
  if (tasaAtencion >= 90) {
    desempeno = "Excelente";
    colorDesempeno = colorVerde;
  } else if (tasaAtencion >= 75) {
    desempeno = "Bueno";
    colorDesempeno = colorCeleste;
  } else if (tasaAtencion >= 60) {
    desempeno = "Regular";
    colorDesempeno = colorNaranja;
  }

  doc.setFillColor(...colorDesempeno);
  doc.roundedRect(17, yPos, 50, 8, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`Desempeño: ${desempeno}`, 19, yPos + 5);

  yPos += 15;

  // ========== DISTRIBUCIÓN POR ESPECIALIDAD ==========
  if (distribucionEspecialidades.length > 0) {
    doc.setFillColor(...colorPrimario);
    doc.rect(15, yPos - 2, pageWidth - 30, 7, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("DISTRIBUCIÓN POR ESPECIALIDAD", 17, yPos + 3);

    yPos += 12;

    const especialidadesOrdenadas = distribucionEspecialidades
      .sort((a, b) => b.consultas - a.consultas);

    especialidadesOrdenadas.forEach((esp, index) => {
      const porcentaje = (esp.consultas / datosProductividad.citasProgramadas * 100).toFixed(1);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colorTexto);
      doc.text(`${esp.nombre}:`, 17, yPos);
      
      doc.setTextColor(...colorVerde);
      doc.text(`${esp.consultas} citas (${porcentaje}%)`, 80, yPos);
      
      yPos += 5;
    });

    yPos += 5;
  }

  // ========== CUMPLIMIENTO DE HORARIO ==========
  doc.setFillColor(...colorPrimario);
  doc.rect(15, yPos - 2, pageWidth - 30, 7, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("CUMPLIMIENTO DE HORARIO", 17, yPos + 3);

  yPos += 12;

  const porcentajeCumplimiento = datosProductividad.horasProgramadas > 0
    ? (estadisticas.totalHoras / datosProductividad.horasProgramadas * 100).toFixed(1)
    : 0;

  const horasExtras = estadisticas.totalHoras - datosProductividad.horasProgramadas;

  const cumplimiento = [
    { label: "Horas Programadas", value: `${datosProductividad.horasProgramadas.toFixed(1)} hrs` },
    { label: "Horas Trabajadas", value: `${estadisticas.totalHoras.toFixed(1)} hrs` },
    { label: "Cumplimiento", value: `${porcentajeCumplimiento}%` },
    { label: horasExtras >= 0 ? "Horas Extras" : "Horas Faltantes", 
      value: `${Math.abs(horasExtras).toFixed(1)} hrs` },
  ];

  cumplimiento.forEach((item, index) => {
    const xOffset = index % 2 === 0 ? 17 : 110;
    const currentY = yPos + Math.floor(index / 2) * 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colorSecundario);
    doc.text(`${item.label}:`, xOffset, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colorVerde);
    doc.text(item.value, xOffset + 45, currentY);
  });

  yPos += Math.ceil(cumplimiento.length / 2) * 6 + 10;

  // Nueva página si es necesario
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 20;
  }

  // ========== DETALLE DE ASISTENCIAS (versión compacta) ==========
  doc.setFillColor(...colorPrimario);
  doc.rect(15, yPos - 2, pageWidth - 30, 7, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DETALLE DE ASISTENCIAS", 17, yPos + 3);

  yPos += 12;

  // Encabezados de tabla
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

  // Filas de asistencias (máximo 10 más recientes)
  const asistenciasLimitadas = asistencias.slice(0, 10);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.setFontSize(8);

  asistenciasLimitadas.forEach((asistencia, index) => {
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

    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(15, yPos - 4, pageWidth - 30, 7, "F");
    }

    const fechaEntrada = asistencia.marca_entrada || asistencia.inicio_turno;
    const fecha = formatearFecha(fechaEntrada);
    const entrada = formatearHora(fechaEntrada);
    const salida = asistencia.marca_salida ? formatearHora(asistencia.marca_salida) : "-";

    let horas = "-";
    if (asistencia.marca_entrada && asistencia.marca_salida) {
      const diff = (new Date(asistencia.marca_salida) - new Date(asistencia.marca_entrada)) / 1000 / 60 / 60;
      horas = `${diff.toFixed(2)}`;
    } else if (asistencia.minutos_trabajados) {
      horas = `${(asistencia.minutos_trabajados / 60).toFixed(2)}`;
    }

    const estado = asistencia.marca_salida ? "Completo" : "En turno";

    doc.setTextColor(...colorTexto);
    doc.text(fecha, 17, yPos);
    doc.text(entrada, 50, yPos);
    doc.text(salida, 80, yPos);
    doc.text(horas, 110, yPos);

    if (estado === "Completo") {
      doc.setTextColor(...colorVerde);
    } else {
      doc.setTextColor(241, 196, 15);
    }
    doc.text(estado, 140, yPos);

    yPos += 7;
  });

  // Nota si hay más asistencias
  if (asistencias.length > 10) {
    yPos += 3;
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text(`Mostrando 10 de ${asistencias.length} asistencias. Ver sistema para detalle completo.`, 17, yPos);
  }

  // ========== PIE DE PÁGINA ==========
  yPos = pageHeight - 25;

  doc.setDrawColor(...colorCeleste);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text("Reporte Profesional de Asistencia - BETA v2.0", pageWidth / 2, yPos, { align: "center" });

  yPos += 4;
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 120);
  const fechaGeneracion = new Date().toLocaleDateString("es-CL");
  const horaGeneracion = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  doc.text(`Generado: ${fechaGeneracion} ${horaGeneracion} - Sistema MedSalud`, pageWidth / 2, yPos, { align: "center" });

  // Línea inferior decorativa
  doc.setFillColor(...colorMorado);
  doc.rect(0, pageHeight - 8, pageWidth, 8, "F");

  // Abrir PDF
  const nombreArchivo = `Reporte_BETA_${empleado.apellido_paterno}_${fechaInicio}_${fechaFin}.pdf`;
  doc.output('dataurlnewwindow', { filename: nombreArchivo });
};
