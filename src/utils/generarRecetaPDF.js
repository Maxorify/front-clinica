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
 * Genera una receta médica en PDF con diseño profesional
 * @param {Object} datos - Datos de la receta
 * @param {Object} datos.paciente - Datos del paciente
 * @param {Object} datos.doctor - Datos del doctor
 * @param {Array} datos.recetas - Lista de medicamentos
 * @param {Array} datos.diagnosticos - Lista de diagnósticos
 * @param {Object} datos.consulta - Información de la consulta
 */
export const generarRecetaPDF = async (datos) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Colores corporativos - Azul clínica (tonos celestes/azul médico)
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
    // Cargar el logo importado
    const img = new Image();
    img.src = logoClinica;
    
    await new Promise((resolve) => {
      img.onload = () => {
        doc.addImage(img, "PNG", 15, yPos, 30, 30);
        resolve();
      };
      img.onerror = () => {
        // Si falla, mostrar texto alternativo
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colorPrimario);
        doc.text("MED", 15, yPos + 8);
        doc.text("SALUD", 15, yPos + 16);
        resolve();
      };
    });
  } catch (error) {
    // Texto alternativo si falla
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colorPrimario);
    doc.text("MEDSALUD", 15, yPos + 15);
  }

  // Información de la clínica (derecha)
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorPrimario);
  doc.text("MEDSALUD", pageWidth - 15, yPos, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...colorTexto);
  doc.text("Balmaceda 243, Laja", pageWidth - 15, yPos + 5, { align: "right" });
  doc.text("+56 9 4557 2744", pageWidth - 15, yPos + 10, { align: "right" });
  doc.text("contacto@med-salud.cl", pageWidth - 15, yPos + 15, { align: "right" });
  doc.text("https://www.med-salud.cl/", pageWidth - 15, yPos + 20, { align: "right" });

  yPos += 40;

  // Título RECETA MÉDICA
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorPrimario);
  doc.text("RECETA MÉDICA", pageWidth / 2, yPos, { align: "center" });

  yPos += 10;

  // ========== INFORMACIÓN DEL DOCTOR ==========
  
  // Caja del doctor
  doc.setDrawColor(...colorPrimario);
  doc.setLineWidth(0.5);
  doc.rect(15, yPos, pageWidth - 30, 22);
  
  yPos += 6;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorSecundario);
  doc.text("DOCTOR:", 20, yPos);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text(datos.doctor.nombre, 45, yPos);
  
  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.text("ESPECIALIDAD:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(datos.doctor.especialidad || "Medicina General", 50, yPos);
  
  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.text("RUT:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(formatearRUT(datos.doctor.rut), 45, yPos);
  
  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.text("FECHA:", 20, yPos);
  doc.setFont("helvetica", "normal");
  const fecha = new Date().toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(fecha, 45, yPos);

  yPos += 12;

  // ========== INFORMACIÓN DEL PACIENTE ==========
  
  doc.setDrawColor(...colorPrimario);
  doc.rect(15, yPos, pageWidth - 30, 17);
  
  yPos += 6;
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorSecundario);
  doc.text("PACIENTE:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.text(datos.paciente.nombre, 45, yPos);
  
  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.text("RUT:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(formatearRUT(datos.paciente.rut), 45, yPos);
  
  doc.setFont("helvetica", "bold");
  doc.text("EDAD:", 110, yPos);
  doc.setFont("helvetica", "normal");
  const edad = calcularEdad(datos.paciente.fecha_nacimiento);
  const edadTexto = edad === "N/A" ? "N/A" : `${edad} años`;
  doc.text(edadTexto, 125, yPos);

  yPos += 12;

  // ========== DIAGNÓSTICOS ==========
  
  if (datos.diagnosticos && datos.diagnosticos.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colorPrimario);
    doc.text("DIAGNÓSTICOS:", 15, yPos);
    
    yPos += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colorTexto);
    
    datos.diagnosticos.forEach((diag, index) => {
      doc.text(`${index + 1}. ${diag}`, 20, yPos);
      yPos += 5;
    });
    
    yPos += 3;
  }

  // ========== PRESCRIPCIONES ==========
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorPrimario);
  doc.text("PRESCRIPCIONES:", 15, yPos);
  
  yPos += 8;

  // Encabezado de tabla
  doc.setFillColor(...colorPrimario);
  doc.rect(15, yPos - 5, pageWidth - 30, 8, "F");
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("MEDICAMENTO", 20, yPos);
  doc.text("PRESENTACIÓN", 75, yPos);
  doc.text("DOSIS", 120, yPos);
  doc.text("DURACIÓN", 155, yPos);

  yPos += 8;

  // Filas de medicamentos
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colorTexto);
  doc.setFontSize(8);

  datos.recetas.forEach((receta, index) => {
    // Alternar color de fondo
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(15, yPos - 4, pageWidth - 30, 7, "F");
    }

    doc.text(receta.nombre, 20, yPos);
    doc.text(receta.presentacion, 75, yPos);
    doc.text(receta.dosis, 120, yPos);
    doc.text(receta.duracion, 155, yPos);

    yPos += 7;

    // Nueva página si es necesario
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }
  });

  yPos += 5;

  // ========== INDICACIONES ==========
  
  if (datos.consulta.tratamiento) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colorPrimario);
    doc.text("INDICACIONES:", 15, yPos);
    
    yPos += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colorTexto);
    
    const indicaciones = doc.splitTextToSize(datos.consulta.tratamiento, pageWidth - 40);
    doc.text(indicaciones, 20, yPos);
    yPos += indicaciones.length * 5 + 5;
  }

  // ========== FIRMA Y PIE DE PÁGINA ==========
  
  // Posicionar firma al final
  yPos = Math.max(yPos + 15, pageHeight - 50);

  // Línea de firma
  doc.setDrawColor(...colorSecundario);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 30, yPos, pageWidth / 2 + 30, yPos);
  
  yPos += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorSecundario);
  doc.text("Dr. " + datos.doctor.nombre, pageWidth / 2, yPos, { align: "center" });
  
  yPos += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(datos.doctor.especialidad || "Medicina General", pageWidth / 2, yPos, { align: "center" });

  // Pie de página
  yPos = pageHeight - 15;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Este documento es una prescripción médica válida. Conserve para su seguimiento médico.",
    pageWidth / 2,
    yPos,
    { align: "center" }
  );
  
  doc.text(
    `Generado el ${new Date().toLocaleDateString("es-CL")} a las ${new Date().toLocaleTimeString("es-CL")}`,
    pageWidth / 2,
    yPos + 4,
    { align: "center" }
  );

  // Línea inferior decorativa
  doc.setFillColor(...colorCeleste);
  doc.rect(0, pageHeight - 5, pageWidth, 5, "F");

  // Abrir en nueva pestaña
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, "_blank");
};

/**
 * Calcula la edad a partir de una fecha de nacimiento
 */
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) {
    return "N/A";
  }
  
  try {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    
    // Validar que la fecha sea válida
    if (isNaN(nacimiento.getTime())) {
      return "N/A";
    }
    
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  } catch (error) {
    console.error("Error al calcular edad:", error);
    return "N/A";
  }
};
