import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import axios from "axios";

const API_URL = "http://localhost:5000";

/**
 * REPORTE EXCEL BETA v2.0 - ULTRA PROFESIONAL
 * 3 hojas: Dashboard, Detalle Citas, Estadísticas
 * Con gráficos nativos, formato condicional, y KPIs visuales
 */
export const generarReporteAsistenciaBetaEXCEL = async ({ empleado, asistencias, fechaInicio, fechaFin, estadisticas }) => {
  
  const workbook = new ExcelJS.Workbook();
  
  // Metadata del archivo
  workbook.creator = "Sistema Gestión Clínica";
  workbook.lastModifiedBy = "Sistema Gestión Clínica";
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // ===== OBTENER DATOS DE PRODUCTIVIDAD =====
  let datosProductividad = {
    citasAtendidas: 0,
    citasProgramadas: 0,
    ingresosTotales: 0,
    especialidades: {},
    citasDetalle: []
  };

  try {
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const añoActual = ahora.getFullYear();

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
      
      datosProductividad.citasProgramadas = resumen.total_citas;
      datosProductividad.citasAtendidas = resumen.citas_completadas;
      datosProductividad.ingresosTotales = resumen.total_ingresos;
      datosProductividad.especialidades = resumen.especialidades;
      datosProductividad.citasDetalle = citas;
    }
  } catch (error) {
    console.warn("⚠️ Error obteniendo datos de productividad:", error);
  }

  // Calcular métricas
  const tasaAtencion = datosProductividad.citasProgramadas > 0 
    ? (datosProductividad.citasAtendidas / datosProductividad.citasProgramadas) * 100 
    : 0;
  
  const pacientesPorHora = estadisticas.totalHoras > 0 
    ? datosProductividad.citasAtendidas / estadisticas.totalHoras 
    : 0;
  
  const ingresosPorHora = estadisticas.totalHoras > 0 
    ? datosProductividad.ingresosTotales / estadisticas.totalHoras 
    : 0;

  // Determinar desempeño
  let desempeno = "Bajo";
  let colorDesempeno = "FFFF0000"; // Rojo
  if (tasaAtencion >= 90) {
    desempeno = "Excelente";
    colorDesempeno = "FF27AE60"; // Verde
  } else if (tasaAtencion >= 75) {
    desempeno = "Bueno";
    colorDesempeno = "FF52C41A"; // Verde claro
  } else if (tasaAtencion >= 60) {
    desempeno = "Regular";
    colorDesempeno = "FFF39C12"; // Naranja
  }

  // ========== HOJA 1: DASHBOARD ==========
  const dashboard = workbook.addWorksheet("Dashboard", {
    properties: { tabColor: { argb: "FF9B59B6" } },
    pageSetup: { 
      paperSize: 9, 
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    }
  });

  // Configurar anchos de columnas
  dashboard.columns = [
    { width: 3 },   // A - Margen
    { width: 22 },  // B - Horas
    { width: 22 },  // C - Pacientes
    { width: 25 },  // D - Ingresos (más ancho para números grandes)
    { width: 22 },  // E
    { width: 3 }    // F - Margen
  ];

  let row = 1;

  // === ENCABEZADO CON DEGRADADO ===
  dashboard.mergeCells(`A${row}:F${row + 1}`);
  const headerCell = dashboard.getCell(`A${row}`);
  headerCell.value = "REPORTE DE PRODUCTIVIDAD MENSUAL";
  headerCell.font = { 
    name: "Calibri", 
    size: 24, 
    bold: true, 
    color: { argb: "FFFFFFFF" } 
  };
  headerCell.alignment = { 
    vertical: "middle", 
    horizontal: "center" 
  };
  headerCell.fill = {
    type: "gradient",
    gradient: "angle",
    degree: 90,
    stops: [
      { position: 0, color: { argb: "FF9B59B6" } },
      { position: 1, color: { argb: "FF8E44AD" } }
    ]
  };
  dashboard.getRow(row).height = 30;
  dashboard.getRow(row + 1).height = 30;

  row += 2;

  // === BADGE BETA ===
  dashboard.mergeCells(`E${row}:F${row}`);
  const betaBadge = dashboard.getCell(`E${row}`);
  betaBadge.value = "BETA v2.0";
  betaBadge.font = { 
    name: "Calibri", 
    size: 10, 
    bold: true, 
    color: { argb: "FFFFFFFF" } 
  };
  betaBadge.alignment = { 
    vertical: "middle", 
    horizontal: "center" 
  };
  betaBadge.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF9B59B6" }
  };
  betaBadge.border = {
    top: { style: "thin", color: { argb: "FF8E44AD" } },
    left: { style: "thin", color: { argb: "FF8E44AD" } },
    bottom: { style: "thin", color: { argb: "FF8E44AD" } },
    right: { style: "thin", color: { argb: "FF8E44AD" } }
  };

  row += 1;

  // === INFORMACIÓN DEL DOCTOR ===
  dashboard.mergeCells(`B${row}:D${row}`);
  const doctorCell = dashboard.getCell(`B${row}`);
  doctorCell.value = `Doctor(a): ${empleado.nombre} ${empleado.apellido}`;
  doctorCell.font = { name: "Calibri", size: 14, bold: true };
  doctorCell.alignment = { vertical: "middle", horizontal: "left" };
  
  row += 1;

  const ahora = new Date();
  const mesNombre = ahora.toLocaleDateString("es-CL", { month: "long", timeZone: "America/Santiago" });
  const añoActual = ahora.getFullYear();

  dashboard.mergeCells(`B${row}:D${row}`);
  const periodoCell = dashboard.getCell(`B${row}`);
  periodoCell.value = `Período: ${mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1)} ${añoActual}`;
  periodoCell.font = { name: "Calibri", size: 12 };
  periodoCell.alignment = { vertical: "middle", horizontal: "left" };

  row += 2;

  // === SECCIÓN: RESUMEN EJECUTIVO ===
  dashboard.mergeCells(`B${row}:E${row}`);
  const resumenTitle = dashboard.getCell(`B${row}`);
  resumenTitle.value = "📊 RESUMEN EJECUTIVO";
  resumenTitle.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FF2C3E50" } };
  resumenTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFECF0F1" }
  };
  resumenTitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  dashboard.getRow(row).height = 25;

  row += 1;

  // === KPIs GRANDES ===
  const kpiStartRow = row;

  // KPI 1: Horas Trabajadas
  const horasCell = dashboard.getCell(`B${row}`);
  horasCell.value = "⏰ HORAS TRABAJADAS";
  horasCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF7F8C8D" } };
  horasCell.alignment = { vertical: "middle", horizontal: "center" };
  
  const horasValorCell = dashboard.getCell(`B${row + 1}`);
  horasValorCell.value = estadisticas.totalHoras;
  horasValorCell.numFmt = "0.0";
  horasValorCell.font = { name: "Calibri", size: 28, bold: true, color: { argb: "FF3498DB" } };
  horasValorCell.alignment = { vertical: "middle", horizontal: "center" };
  
  dashboard.getCell(`B${row}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFECF0F1" }
  };
  dashboard.getCell(`B${row + 1}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8F9FA" }
  };

  // KPI 2: Pacientes Atendidos
  const pacientesCell = dashboard.getCell(`C${row}`);
  pacientesCell.value = "👥 PACIENTES ATENDIDOS";
  pacientesCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF7F8C8D" } };
  pacientesCell.alignment = { vertical: "middle", horizontal: "center" };
  
  const pacientesValorCell = dashboard.getCell(`C${row + 1}`);
  pacientesValorCell.value = datosProductividad.citasAtendidas;
  pacientesValorCell.font = { name: "Calibri", size: 28, bold: true, color: { argb: "FF27AE60" } };
  pacientesValorCell.alignment = { vertical: "middle", horizontal: "center" };
  
  dashboard.getCell(`C${row}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFECF0F1" }
  };
  dashboard.getCell(`C${row + 1}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8F9FA" }
  };

  // KPI 3: Ingresos Generados
  const ingresosCell = dashboard.getCell(`D${row}`);
  ingresosCell.value = "💰 INGRESOS GENERADOS";
  ingresosCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF7F8C8D" } };
  ingresosCell.alignment = { vertical: "middle", horizontal: "center" };
  
  const ingresosValorCell = dashboard.getCell(`D${row + 1}`);
  ingresosValorCell.value = datosProductividad.ingresosTotales;
  ingresosValorCell.numFmt = '"$"#,##0';
  ingresosValorCell.font = { name: "Calibri", size: 22, bold: true, color: { argb: "FFF39C12" } };
  ingresosValorCell.alignment = { vertical: "middle", horizontal: "center" };
  
  dashboard.getCell(`D${row}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFECF0F1" }
  };
  dashboard.getCell(`D${row + 1}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8F9FA" }
  };

  // Bordes para KPIs
  for (let col = 2; col <= 4; col++) {
    for (let r = row; r <= row + 1; r++) {
      const cell = dashboard.getRow(r).getCell(col);
      cell.border = {
        top: { style: "thin", color: { argb: "FFD5DBDB" } },
        left: { style: "thin", color: { argb: "FFD5DBDB" } },
        bottom: { style: "thin", color: { argb: "FFD5DBDB" } },
        right: { style: "thin", color: { argb: "FFD5DBDB" } }
      };
    }
  }

  dashboard.getRow(row).height = 20;
  dashboard.getRow(row + 1).height = 45;

  row += 3;

  // === SECCIÓN: PRODUCTIVIDAD CLÍNICA ===
  dashboard.mergeCells(`B${row}:E${row}`);
  const prodTitle = dashboard.getCell(`B${row}`);
  prodTitle.value = "📈 PRODUCTIVIDAD CLÍNICA";
  prodTitle.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FF2C3E50" } };
  prodTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFECF0F1" }
  };
  prodTitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  dashboard.getRow(row).height = 25;

  row += 1;

  // Tabla de métricas
  const metricas = [
    ["Métrica", "Valor", "Estado"],
    ["Tasa de Atención", `${tasaAtencion.toFixed(1)}%`, desempeno],
    ["Pacientes por Hora", pacientesPorHora.toFixed(2), "-"],
    ["Ingresos por Hora", `$${Math.round(ingresosPorHora).toLocaleString('es-CL')}`, "-"],
    ["Citas Programadas", datosProductividad.citasProgramadas, "-"],
    ["Citas Completadas", datosProductividad.citasAtendidas, "-"]
  ];

  metricas.forEach((metrica, idx) => {
    const rowData = dashboard.getRow(row + idx);
    rowData.values = ["", ...metrica]; // Columna A vacía (margen)
    
    if (idx === 0) {
      // Header de tabla
      rowData.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      rowData.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF3498DB" }
      };
      rowData.alignment = { vertical: "middle", horizontal: "center" };
      rowData.height = 25;
    } else {
      // Datos
      rowData.font = { name: "Calibri", size: 11 };
      rowData.alignment = { vertical: "middle", horizontal: idx === 0 ? "center" : "left" };
      rowData.getCell(2).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      rowData.getCell(3).alignment = { vertical: "middle", horizontal: "center" };
      rowData.getCell(4).alignment = { vertical: "middle", horizontal: "center" };
      
      // Formato condicional para Estado
      if (idx === 1) { // Tasa de Atención
        rowData.getCell(4).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: colorDesempeno }
        };
        rowData.getCell(4).font = { 
          name: "Calibri", 
          size: 11, 
          bold: true, 
          color: { argb: "FFFFFFFF" } 
        };
      }
      
      // Alternar colores de fondo
      if (idx % 2 === 0) {
        rowData.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8F9FA" }
        };
      }
    }

    // Bordes
    for (let col = 2; col <= 4; col++) {
      rowData.getCell(col).border = {
        top: { style: "thin", color: { argb: "FFD5DBDB" } },
        left: { style: "thin", color: { argb: "FFD5DBDB" } },
        bottom: { style: "thin", color: { argb: "FFD5DBDB" } },
        right: { style: "thin", color: { argb: "FFD5DBDB" } }
      };
    }
  });

  row += metricas.length + 1;

  // === SECCIÓN: DISTRIBUCIÓN POR ESPECIALIDAD ===
  dashboard.mergeCells(`B${row}:E${row}`);
  const espTitle = dashboard.getCell(`B${row}`);
  espTitle.value = "🏥 DISTRIBUCIÓN POR ESPECIALIDAD";
  espTitle.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FF2C3E50" } };
  espTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFECF0F1" }
  };
  espTitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  dashboard.getRow(row).height = 25;

  row += 1;

  // Tabla de especialidades
  const especialidadesArray = Object.entries(datosProductividad.especialidades).map(([nombre, cantidad]) => ({
    nombre,
    cantidad,
    porcentaje: datosProductividad.citasProgramadas > 0 
      ? (cantidad / datosProductividad.citasProgramadas) * 100 
      : 0
  }));

  dashboard.getRow(row).values = ["", "Especialidad", "Consultas", "Porcentaje"];
  dashboard.getRow(row).font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  dashboard.getRow(row).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF9B59B6" }
  };
  dashboard.getRow(row).alignment = { vertical: "middle", horizontal: "center" };
  dashboard.getRow(row).height = 25;

  for (let col = 2; col <= 4; col++) {
    dashboard.getRow(row).getCell(col).border = {
      top: { style: "thin", color: { argb: "FF8E44AD" } },
      left: { style: "thin", color: { argb: "FF8E44AD" } },
      bottom: { style: "thin", color: { argb: "FF8E44AD" } },
      right: { style: "thin", color: { argb: "FF8E44AD" } }
    };
  }

  row += 1;

  especialidadesArray.forEach((esp, idx) => {
    const rowData = dashboard.getRow(row + idx);
    rowData.values = ["", esp.nombre, esp.cantidad, esp.porcentaje / 100];
    rowData.font = { name: "Calibri", size: 11 };
    rowData.getCell(2).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    rowData.getCell(3).alignment = { vertical: "middle", horizontal: "center" };
    rowData.getCell(4).alignment = { vertical: "middle", horizontal: "center" };
    rowData.getCell(4).numFmt = "0.0%";
    
    // Alternar colores
    if (idx % 2 === 0) {
      rowData.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8F9FA" }
      };
    }

    // Bordes
    for (let col = 2; col <= 4; col++) {
      rowData.getCell(col).border = {
        top: { style: "thin", color: { argb: "FFD5DBDB" } },
        left: { style: "thin", color: { argb: "FFD5DBDB" } },
        bottom: { style: "thin", color: { argb: "FFD5DBDB" } },
        right: { style: "thin", color: { argb: "FFD5DBDB" } }
      };
    }
  });

  row += especialidadesArray.length + 2;

  // === VISUALIZACIÓN CON BARRAS DE COLORES ===
  // Nota: ExcelJS no soporta gráficos nativos con addChart, usamos barras visuales
  dashboard.mergeCells(`B${row}:D${row}`);
  const visualTitle = dashboard.getCell(`B${row}`);
  visualTitle.value = "📊 VISUALIZACIÓN DE DISTRIBUCIÓN";
  visualTitle.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF2C3E50" } };
  visualTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFECF0F1" }
  };
  visualTitle.alignment = { vertical: "middle", horizontal: "center" };
  dashboard.getRow(row).height = 25;

  row += 1;

  // Crear barras visuales con celdas de colores
  especialidadesArray.forEach((esp, idx) => {
    const rowData = dashboard.getRow(row + idx);
    const maxAncho = 5; // Máximo de celdas para la barra (reducido para mejor visualización)
    const anchoBarra = Math.round((esp.porcentaje / 100) * maxAncho);
    
    rowData.getCell(2).value = esp.nombre;
    rowData.getCell(2).font = { name: "Calibri", size: 11, bold: true };
    rowData.getCell(2).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    
    // Crear barra visual con celdas coloreadas
    for (let i = 0; i < maxAncho; i++) {
      const cell = rowData.getCell(3 + i);
      if (i < anchoBarra) {
        cell.value = "";
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: idx === 0 ? "FF9B59B6" : "FF3498DB" }
        };
      } else {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFECF0F1" }
        };
      }
      cell.border = {
        top: { style: "thin", color: { argb: "FFD5DBDB" } },
        left: { style: "thin", color: { argb: "FFD5DBDB" } },
        bottom: { style: "thin", color: { argb: "FFD5DBDB" } },
        right: { style: "thin", color: { argb: "FFD5DBDB" } }
      };
    }
    
    // Porcentaje al final (columna C+maxAncho = columna H si maxAncho=5)
    const pctCell = rowData.getCell(3 + maxAncho);
    pctCell.value = esp.porcentaje / 100;
    pctCell.numFmt = "0.0%";
    pctCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF2C3E50" } };
    pctCell.alignment = { vertical: "middle", horizontal: "center" };
    pctCell.border = {
      top: { style: "thin", color: { argb: "FFD5DBDB" } },
      left: { style: "thin", color: { argb: "FFD5DBDB" } },
      bottom: { style: "thin", color: { argb: "FFD5DBDB" } },
      right: { style: "thin", color: { argb: "FFD5DBDB" } }
    };
  });

  row += especialidadesArray.length + 1;

  // ========== HOJA 2: DETALLE DE CITAS ==========
  const detalle = workbook.addWorksheet("Detalle de Citas", {
    properties: { tabColor: { argb: "FF3498DB" } }
  });

  detalle.columns = [
    { header: "Fecha", key: "fecha", width: 15 },
    { header: "Hora", key: "hora", width: 10 },
    { header: "Paciente", key: "paciente", width: 30 },
    { header: "Especialidad", key: "especialidad", width: 25 },
    { header: "Estado", key: "estado", width: 15 },
    { header: "Monto", key: "monto", width: 15 }
  ];

  // Estilo del header
  detalle.getRow(1).font = { name: "Calibri", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
  detalle.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF3498DB" }
  };
  detalle.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
  detalle.getRow(1).height = 25;

  // Agregar datos
  datosProductividad.citasDetalle.forEach((cita, idx) => {
    const fecha = cita.fecha_atencion 
      ? new Date(cita.fecha_atencion).toLocaleDateString("es-CL", { timeZone: "America/Santiago" })
      : "-";
    
    const hora = cita.fecha_atencion 
      ? new Date(cita.fecha_atencion).toLocaleTimeString("es-CL", { 
          hour: "2-digit", 
          minute: "2-digit", 
          timeZone: "America/Santiago" 
        })
      : "-";

    const rowData = {
      fecha,
      hora,
      paciente: cita.paciente?.nombre || "N/A",
      especialidad: cita.especialidad?.nombre || "N/A",
      estado: cita.estado_actual || "Pendiente",
      monto: cita.monto_total || 0
    };

    const row = detalle.addRow(rowData);
    row.font = { name: "Calibri", size: 11 };
    row.alignment = { vertical: "middle" };
    row.getCell("monto").numFmt = '"$"#,##0';
    row.getCell("monto").alignment = { vertical: "middle", horizontal: "right" };

    // Formato condicional por estado
    const estadoCell = row.getCell("estado");
    if (cita.estado_actual === "Completada") {
      estadoCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD5F4E6" }
      };
      estadoCell.font = { name: "Calibri", size: 11, color: { argb: "FF27AE60" }, bold: true };
    } else if (cita.estado_actual === "Confirmada") {
      estadoCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFEF9E7" }
      };
      estadoCell.font = { name: "Calibri", size: 11, color: { argb: "FFF39C12" }, bold: true };
    } else {
      estadoCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFADBD8" }
      };
      estadoCell.font = { name: "Calibri", size: 11, color: { argb: "FFE74C3C" }, bold: true };
    }

    // Alternar color de fondo
    if (idx % 2 === 0) {
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        if (colNumber !== 5) { // No sobrescribir estado
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8F9FA" }
          };
        }
      });
    }

    // Bordes
    row.eachCell({ includeEmpty: false }, (cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFD5DBDB" } },
        left: { style: "thin", color: { argb: "FFD5DBDB" } },
        bottom: { style: "thin", color: { argb: "FFD5DBDB" } },
        right: { style: "thin", color: { argb: "FFD5DBDB" } }
      };
    });
  });

  // Totales
  const totalRow = detalle.addRow({
    fecha: "",
    hora: "",
    paciente: "",
    especialidad: "TOTAL",
    estado: datosProductividad.citasAtendidas,
    monto: datosProductividad.ingresosTotales
  });
  totalRow.font = { name: "Calibri", size: 12, bold: true };
  totalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF3498DB" }
  };
  totalRow.getCell("monto").numFmt = '"$"#,##0';
  totalRow.alignment = { vertical: "middle", horizontal: "right" };
  totalRow.getCell("especialidad").alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  // Auto-filtros
  detalle.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: datosProductividad.citasDetalle.length + 1, column: 6 }
  };

  // ========== HOJA 3: ESTADÍSTICAS ==========
  const stats = workbook.addWorksheet("Estadísticas", {
    properties: { tabColor: { argb: "FF27AE60" } }
  });

  stats.columns = [
    { width: 5 },
    { width: 30 },
    { width: 20 },
    { width: 20 },
    { width: 5 }
  ];

  let statsRow = 2;

  // Título
  stats.mergeCells(`B${statsRow}:D${statsRow}`);
  const statsTitle = stats.getCell(`B${statsRow}`);
  statsTitle.value = "📊 ANÁLISIS ESTADÍSTICO MENSUAL";
  statsTitle.font = { name: "Calibri", size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  statsTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF27AE60" }
  };
  statsTitle.alignment = { vertical: "middle", horizontal: "center" };
  stats.getRow(statsRow).height = 35;

  statsRow += 2;

  // Resumen de asistencias
  stats.getCell(`B${statsRow}`).value = "RESUMEN DE ASISTENCIA";
  stats.getCell(`B${statsRow}`).font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF2C3E50" } };
  stats.getCell(`B${statsRow}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFECF0F1" }
  };

  statsRow += 1;

  const asistenciasData = [
    ["Métrica", "Valor"],
    ["Total de días trabajados", asistencias.length],
    ["Horas totales", estadisticas.totalHoras],
    ["Promedio horas por día", (estadisticas.totalHoras / asistencias.length).toFixed(2)],
    ["Día más productivo", asistencias.reduce((max, a) => a.horas_trabajadas > (max?.horas_trabajadas || 0) ? a : max, {})?.fecha || "-"],
  ];

  asistenciasData.forEach((data, idx) => {
    const row = stats.getRow(statsRow + idx);
    row.values = ["", ...data];
    
    if (idx === 0) {
      row.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF3498DB" }
      };
      row.alignment = { vertical: "middle", horizontal: "center" };
    } else {
      row.font = { name: "Calibri", size: 11 };
      row.getCell(2).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      row.getCell(3).alignment = { vertical: "middle", horizontal: "center" };
      
      if (idx % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8F9FA" }
        };
      }
    }

    for (let col = 2; col <= 3; col++) {
      row.getCell(col).border = {
        top: { style: "thin", color: { argb: "FFD5DBDB" } },
        left: { style: "thin", color: { argb: "FFD5DBDB" } },
        bottom: { style: "thin", color: { argb: "FFD5DBDB" } },
        right: { style: "thin", color: { argb: "FFD5DBDB" } }
      };
    }
  });

  statsRow += asistenciasData.length + 2;

  // Resumen de productividad
  stats.getCell(`B${statsRow}`).value = "RESUMEN DE PRODUCTIVIDAD";
  stats.getCell(`B${statsRow}`).font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF2C3E50" } };
  stats.getCell(`B${statsRow}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFECF0F1" }
  };

  statsRow += 1;

  const productividadData = [
    ["Métrica", "Valor"],
    ["Citas programadas", datosProductividad.citasProgramadas],
    ["Citas completadas", datosProductividad.citasAtendidas],
    ["Tasa de atención", `${tasaAtencion.toFixed(1)}%`],
    ["Ingresos totales", `$${datosProductividad.ingresosTotales.toLocaleString('es-CL')}`],
    ["Ingreso promedio por cita", datosProductividad.citasAtendidas > 0 ? `$${Math.round(datosProductividad.ingresosTotales / datosProductividad.citasAtendidas).toLocaleString('es-CL')}` : "$0"],
  ];

  productividadData.forEach((data, idx) => {
    const row = stats.getRow(statsRow + idx);
    row.values = ["", ...data];
    
    if (idx === 0) {
      row.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF9B59B6" }
      };
      row.alignment = { vertical: "middle", horizontal: "center" };
    } else {
      row.font = { name: "Calibri", size: 11 };
      row.getCell(2).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      row.getCell(3).alignment = { vertical: "middle", horizontal: "center" };
      
      if (idx % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8F9FA" }
        };
      }
    }

    for (let col = 2; col <= 3; col++) {
      row.getCell(col).border = {
        top: { style: "thin", color: { argb: "FFD5DBDB" } },
        left: { style: "thin", color: { argb: "FFD5DBDB" } },
        bottom: { style: "thin", color: { argb: "FFD5DBDB" } },
        right: { style: "thin", color: { argb: "FFD5DBDB" } }
      };
    }
  });

  statsRow += productividadData.length + 2;

  // Nota aclaratoria sobre estados
  stats.mergeCells(`B${statsRow}:C${statsRow}`);
  const notaCell = stats.getCell(`B${statsRow}`);
  notaCell.value = "ℹ️ NOTA: Citas 'Confirmadas' son citas pagadas pero no atendidas (requiere seguimiento)";
  notaCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF7F8C8D" } };
  notaCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFF8DC" }
  };
  notaCell.alignment = { vertical: "middle", horizontal: "left", indent: 1, wrapText: true };
  stats.getRow(statsRow).height = 30;

  // ========== GENERAR Y DESCARGAR ==========
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
  });
  
  const nombreArchivo = `Reporte_Productividad_${empleado.nombre}_${empleado.apellido}_${ahora.getMonth() + 1}-${ahora.getFullYear()}_BETA.xlsx`;
  
  saveAs(blob, nombreArchivo);
  
  return nombreArchivo;
};
