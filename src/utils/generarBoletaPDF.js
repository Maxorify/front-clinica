import jsPDF from "jspdf";
import logoClinica from "../assets/clinic_oficial-removebg-preview.png";

/**
 * Formatea un RUT chileno al formato XX.XXX.XXX-X
 * @param {string|number} rut - RUT sin formato
 * @returns {string} RUT formateado
 */
const formatearRUT = (rut) => {
  if (!rut) return "N/A";
  
  // Convertir a string y limpiar cualquier formato previo
  let rutLimpio = rut.toString().replace(/[^0-9kK]/g, "");
  
  // Separar dígito verificador
  const dv = rutLimpio.slice(-1);
  let rutNumeros = rutLimpio.slice(0, -1);
  
  // Agregar puntos cada 3 dígitos desde atrás
  rutNumeros = rutNumeros.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  return `${rutNumeros}-${dv}`;
};

/**
 * Formatea un número como moneda chilena
 * @param {number} monto - Monto a formatear
 * @returns {string} Monto formateado
 */
const formatearMoneda = (monto) => {
  return `$${new Intl.NumberFormat("es-CL").format(monto)}`;
};

/**
 * Genera una boleta de pago en PDF con diseño profesional
 * @param {Object} datos - Datos de la boleta
 * @param {Object} datos.datoPago - Información del pago
 * @param {Object} datos.cita - Información de la cita
 */
export const generarBoletaPDF = async ({ datoPago, cita }) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Normalizar la estructura de datoPago para soportar ambos casos:
  // 1. Desde recepción: { pago: {...}, monto_original, monto_final, descuento_aplicado }
  // 2. Desde boletas generadas: { pago: {...} } (sin monto_original/monto_final directamente)
  const pagoInfo = datoPago.pago || datoPago;
  const montoOriginal = datoPago.monto_original || pagoInfo.total || 0;
  const montoFinal = datoPago.monto_final || pagoInfo.total || 0;
  const descuentoAplicado = datoPago.descuento_aplicado || 0;

  // Colores corporativos - Azul clínica MedSalud
  const colorPrimario = [41, 128, 185]; // Azul clínica principal (#2980b9)
  const colorSecundario = [52, 73, 94]; // Azul oscuro (#34495e)
  const colorTexto = [44, 62, 80]; // Azul texto oscuro (#2c3e50)
  const colorCeleste = [52, 152, 219]; // Celeste brillante (#3498db)

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

  // Información de la clínica (lado derecho del logo)
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
  doc.text("www.med-salud.cl", 55, yPos + 23);

  // BOLETA (lado derecho)
  doc.setFillColor(...colorPrimario);
  doc.roundedRect(140, yPos, 55, 30, 2, 2, "F");
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("BOLETA", 167.5, yPos + 10, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${String(pagoInfo.id).padStart(8, '0')}`, 167.5, yPos + 17, { align: "center" });
  
  const fechaBoleta = new Date(pagoInfo.fecha_pago).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  doc.setFontSize(8);
  doc.text(fechaBoleta, 167.5, yPos + 23, { align: "center" });

  yPos = 60;

  // Línea separadora
  doc.setDrawColor(...colorCeleste);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 10;

  // ========== INFORMACIÓN DEL PACIENTE ==========
  doc.setFillColor(...colorPrimario);
  doc.rect(15, yPos - 2, 85, 7, "F");
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DATOS DEL PACIENTE", 17, yPos + 3);

  yPos += 10;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorSecundario);
  doc.text("NOMBRE:", 17, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  const nombrePaciente = `${cita.paciente.nombre} ${cita.paciente.apellido_paterno} ${cita.paciente.apellido_materno || ""}`.trim();
  doc.text(nombrePaciente, 37, yPos);

  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorSecundario);
  doc.text("RUT:", 17, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text(formatearRUT(cita.paciente.rut), 37, yPos);

  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorSecundario);
  doc.text("TELÉFONO:", 17, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text(cita.paciente.telefono || "N/A", 37, yPos);

  // ========== INFORMACIÓN DEL PROFESIONAL ==========
  yPos += 12;
  
  doc.setFillColor(...colorPrimario);
  doc.rect(15, yPos - 2, 85, 7, "F");
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("PROFESIONAL TRATANTE", 17, yPos + 3);

  yPos += 10;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorSecundario);
  doc.text("DOCTOR(A):", 17, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  const nombreDoctor = `Dr(a). ${cita.doctor.nombre} ${cita.doctor.apellido_paterno} ${cita.doctor.apellido_materno || ""}`.trim();
  doc.text(nombreDoctor, 40, yPos);

  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorSecundario);
  doc.text("ÁREA:", 17, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text(cita.especialidad?.nombre || "No especificada", 31, yPos);

  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorSecundario);
  doc.text("ATENCIÓN:", 17, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  const fechaAtencion = new Date(cita.fecha_atencion).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(fechaAtencion, 40, yPos);

  yPos += 12;

  // ========== DETALLE DE SERVICIOS (TABLA) ==========
  doc.setFillColor(...colorPrimario);
  doc.rect(15, yPos - 2, pageWidth - 30, 7, "F");
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DETALLE DE SERVICIOS", 17, yPos + 3);

  yPos += 12;

  // Encabezados de la tabla
  doc.setFillColor(...colorCeleste);
  doc.rect(15, yPos - 5, pageWidth - 30, 8, "F");
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DESCRIPCIÓN", 17, yPos);
  doc.text("MONTO", pageWidth - 40, yPos, { align: "right" });

  yPos += 8;

  // Líneas de la tabla
  doc.setDrawColor(...colorSecundario);
  doc.setLineWidth(0.3);
  
  // Consulta médica
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text("Consulta Médica", 17, yPos);
  doc.text(formatearMoneda(montoOriginal), pageWidth - 40, yPos, { align: "right" });
  
  yPos += 6;
  doc.line(15, yPos, pageWidth - 15, yPos);

  // Descuento (si aplica)
  if (descuentoAplicado > 0) {
    yPos += 6;
    doc.setTextColor(...colorPrimario);
    doc.text(`Descuento aplicado (${descuentoAplicado}%)`, 17, yPos);
    const montoDescuento = montoOriginal - montoFinal;
    doc.text(`-${formatearMoneda(montoDescuento)}`, pageWidth - 40, yPos, { align: "right" });
    
    yPos += 6;
    doc.setDrawColor(...colorSecundario);
    doc.line(15, yPos, pageWidth - 15, yPos);
  }

  yPos += 10;

  // ========== MÉTODO DE PAGO ==========
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorSecundario);
  doc.text("MÉTODO DE PAGO:", 17, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text(pagoInfo.tipo_pago, 55, yPos);

  yPos += 10;

  // ========== TOTAL (RECUADRO DESTACADO) ==========
  doc.setFillColor(240, 248, 255); // Azul muy claro
  doc.setDrawColor(...colorPrimario);
  doc.setLineWidth(1);
  doc.roundedRect(15, yPos, pageWidth - 30, 18, 2, 2, "FD");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorPrimario);
  doc.text("TOTAL PAGADO:", 20, yPos + 11);
  
  doc.setFontSize(16);
  doc.text(formatearMoneda(montoFinal), pageWidth - 20, yPos + 11, { align: "right" });

  yPos += 28;

  // ========== SECCIÓN DE TIMBRADO ==========
  doc.setDrawColor(...colorCeleste);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 8;

  doc.setFillColor(...colorCeleste);
  doc.rect(15, yPos - 2, 60, 7, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("TIMBRE Y FIRMA", 17, yPos + 3);

  yPos += 15;

  // Área de firma/timbre
  doc.setDrawColor(...colorSecundario);
  doc.setLineWidth(0.3);
  doc.setLineDash([2, 2]);
  doc.rect(15, yPos, 80, 30);
  doc.setLineDash([]);

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  doc.text("Timbre de la clínica", 55, yPos + 35, { align: "center" });

  // Información del identificador
  yPos += 12;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text(`Identificador: BOL-${String(pagoInfo.id).padStart(8, '0')}`, 110, yPos);
  
  yPos += 5;
  const horaEmision = new Date(pagoInfo.fecha_pago).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Emitida: ${fechaBoleta} ${horaEmision}`, 110, yPos);

  // ========== PIE DE PÁGINA ==========
  yPos = pageHeight - 25;

  doc.setDrawColor(...colorCeleste);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text("Este documento es un comprobante válido de pago", pageWidth / 2, yPos, { align: "center" });
  
  yPos += 4;
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 120);
  doc.text("Gracias por confiar en MedSalud", pageWidth / 2, yPos, { align: "center" });

  // Línea inferior decorativa
  doc.setFillColor(...colorCeleste);
  doc.rect(0, pageHeight - 8, pageWidth, 8, "F");

  // Abrir PDF en nueva pestaña para imprimir
  const nombreArchivo = `Boleta_${String(datoPago.pago.id).padStart(8, '0')}_${cita.paciente.apellido_paterno}.pdf`;
  doc.output('dataurlnewwindow', { filename: nombreArchivo });
};
