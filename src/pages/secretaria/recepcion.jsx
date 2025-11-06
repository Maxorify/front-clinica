import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import jsPDF from "jspdf";
import logoGrande from "../../assets/logo-grande.webp";

const API_URL = "http://localhost:5000";

export default function Recepcion() {
  const [citas, setCitas] = useState([]);
  const [citasFiltradas, setCitasFiltradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState(
    new Date().toISOString().split("T")[0]
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

  useEffect(() => {
    const abortController = new AbortController();
    cargarCitas(abortController.signal);

    // Cleanup: cancelar peticiones pendientes cuando cambie la fecha o se desmonte
    return () => {
      abortController.abort();
    };
  }, [fechaFiltro]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const showNotification = (type, message) => {
    setNotification({ id: Date.now(), type, message });
  };

  const cargarCitas = async (signal) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/Citas/listar-citas`, {
        params: {
          fecha: fechaFiltro,
          estado: "Pendiente",
        },
        signal,
      });

      setCitas(response.data.citas || []);
      setCitasFiltradas(response.data.citas || []);
    } catch (error) {
      // Ignorar errores de cancelación
      if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
        console.log("Petición cancelada correctamente");
        return;
      }
      console.error("Error al cargar citas:", error);
      showNotification("error", "Error al cargar las citas");
      setCitas([]);
      setCitasFiltradas([]);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalPago = async (cita) => {
    try {
      // Obtener la especialidad del doctor para obtener el precio
      const doctorResponse = await axios.get(
        `${API_URL}/Usuarios/obtener-usuario/${cita.doctor.id}`
      );
      const especialidadId = doctorResponse.data.especialidades?.[0]?.id;

      if (!especialidadId) {
        showNotification(
          "error",
          "El doctor no tiene una especialidad asignada"
        );
        return;
      }

      // Obtener el precio de la especialidad
      const precioResponse = await axios.get(
        `${API_URL}/Citas/precio-especialidad/${especialidadId}`
      );
      const precio = precioResponse.data.costo_servicio?.precio || 0;

      console.log("🔍 DEBUG - Precio obtenido:", precio);
      console.log("🔍 DEBUG - Respuesta completa:", precioResponse.data);

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
      console.error("Error al obtener precio:", error);

      // Mensajes de error más específicos
      if (
        error.response?.status === 404 &&
        error.config?.url?.includes("obtener-usuario")
      ) {
        showNotification(
          "error",
          "No se pudo obtener la información del doctor"
        );
      } else if (
        error.response?.status === 404 &&
        error.config?.url?.includes("precio-especialidad")
      ) {
        showNotification(
          "error",
          "Esta especialidad no tiene un precio asignado. Por favor, configure el precio en la sección de Especialidades."
        );
      } else {
        showNotification(
          "error",
          error.response?.data?.detail ||
            "Error al obtener el precio de la consulta"
        );
      }
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
      await generarBoletaPDF(response.data, citaSeleccionada);

      // Recargar citas
      await cargarCitas();
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

  const generarBoletaPDF = async (datoPago, cita) => {
    const doc = new jsPDF();

    // Agregar logo
    try {
      const img = new Image();
      img.src = logoGrande;
      doc.addImage(img, "WEBP", 15, 10, 40, 40);
    } catch (error) {
      console.error("Error al cargar logo:", error);
    }

    // Encabezado
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("COMPROBANTE DE PAGO", 105, 30, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Boleta N° ${datoPago.pago.id}`, 105, 40, { align: "center" });
    doc.text(
      `Fecha: ${new Date(datoPago.pago.fecha_pago).toLocaleString("es-CL")}`,
      105,
      47,
      { align: "center" }
    );

    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(15, 55, 195, 55);

    // Información del paciente
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL PACIENTE", 15, 65);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Nombre: ${cita.paciente.nombre} ${cita.paciente.apellido_paterno} ${
        cita.paciente.apellido_materno || ""
      }`,
      15,
      73
    );
    doc.text(`RUT: ${cita.paciente.rut || "N/A"}`, 15, 80);
    doc.text(`Teléfono: ${cita.paciente.telefono || "N/A"}`, 15, 87);

    // Información del doctor
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL PROFESIONAL", 15, 100);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Doctor: Dr(a). ${cita.doctor.nombre} ${cita.doctor.apellido_paterno} ${
        cita.doctor.apellido_materno || ""
      }`,
      15,
      108
    );
    doc.text(
      `Fecha de atención: ${new Date(cita.fecha_atencion).toLocaleString(
        "es-CL"
      )}`,
      15,
      115
    );

    // Línea separadora
    doc.line(15, 123, 195, 123);

    // Detalles del pago
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLE DEL PAGO", 15, 133);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Método de pago: ${datoPago.pago.tipo_pago}`, 15, 141);

    const y = 148;
    doc.text(`Monto base consulta:`, 15, y);
    doc.text(
      `$${new Intl.NumberFormat("es-CL").format(datoPago.monto_original)}`,
      140,
      y
    );

    if (datoPago.descuento_aplicado > 0) {
      doc.text(
        `Descuento aplicado (${datoPago.descuento_aplicado}%):`,
        15,
        y + 7
      );
      doc.text(
        `-$${new Intl.NumberFormat("es-CL").format(
          datoPago.monto_original - datoPago.monto_final
        )}`,
        140,
        y + 7
      );
    }

    // Línea separadora
    doc.setLineWidth(0.3);
    doc.line(15, y + 12, 195, y + 12);

    // Total
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL PAGADO:", 15, y + 20);
    doc.text(
      `$${new Intl.NumberFormat("es-CL").format(datoPago.monto_final)}`,
      140,
      y + 20
    );

    // Pie de página
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Gracias por confiar en nuestros servicios", 105, 270, {
      align: "center",
    });
    doc.text("Este comprobante es válido como respaldo de pago", 105, 275, {
      align: "center",
    });

    // Guardar PDF
    doc.save(
      `Boleta_${datoPago.pago.id}_${cita.paciente.apellido_paterno}.pdf`
    );
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString("es-CL", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Recepción de Pacientes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestiona los pagos de las citas pendientes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
            <button
              onClick={cargarCitas}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* Lista de citas */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : citasFiltradas.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              No hay citas pendientes para este día
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {citasFiltradas.map((cita) => (
              <motion.div
                key={cita.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Paciente
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {cita.paciente.nombre} {cita.paciente.apellido_paterno}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {cita.paciente.rut}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Doctor
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Dr. {cita.doctor.nombre} {cita.doctor.apellido_paterno}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Fecha y Hora
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatearFecha(cita.fecha_atencion)}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                        {cita.estado_actual}
                      </span>
                      <button
                        onClick={() => abrirModalPago(cita)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
                      >
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

      {/* Modal de pago */}
      <AnimatePresence>
        {showModalPago && citaSeleccionada && (
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Procesar Pago
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Paciente: {citaSeleccionada.paciente.nombre}{" "}
                  {citaSeleccionada.paciente.apellido_paterno}
                </p>
              </div>

              <form onSubmit={procesarPago} className="p-6 space-y-6">
                {/* Método de pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Método de Pago <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formPago.tipo_pago}
                    onChange={(e) =>
                      setFormPago({ ...formPago, tipo_pago: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                    <option value="Tarjeta de Crédito">
                      Tarjeta de Crédito
                    </option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>

                {/* Monto base */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monto de la Consulta
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 dark:text-gray-400 font-medium">
                      $
                    </span>
                    <input
                      type="text"
                      value={new Intl.NumberFormat("es-CL").format(
                        formPago.monto_base
                      )}
                      disabled
                      className="w-full pl-8 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                {/* Habilitar descuento */}
                <div className="flex items-center gap-3">
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
                    className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="habilitar_descuento"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Aplicar descuento por aseguradora
                  </label>
                </div>

                {/* Campos de descuento */}
                {formPago.habilitar_descuento && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Porcentaje de Descuento{" "}
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
                          className="w-full pr-8 pl-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        />
                        <span className="absolute right-4 top-3 text-gray-500 dark:text-gray-400 font-medium">
                          %
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Motivo del Descuento{" "}
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
                        rows="2"
                        placeholder="Ejemplo: Convenio con FONASA, Descuento por aseguradora X, etc."
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Total a pagar */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
                  <p className="text-lg font-semibold opacity-90">
                    Total a Pagar
                  </p>
                  <p className="text-4xl font-bold mt-2">
                    $
                    {new Intl.NumberFormat("es-CL").format(
                      calcularMontoFinal()
                    )}
                  </p>
                  {formPago.habilitar_descuento &&
                    formPago.descuento_aseguradora > 0 && (
                      <p className="text-sm opacity-80 mt-2">
                        Ahorro: $
                        {new Intl.NumberFormat("es-CL").format(
                          formPago.monto_base - calcularMontoFinal()
                        )}{" "}
                        ({formPago.descuento_aseguradora}% descuento)
                      </p>
                    )}
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={cerrarModalPago}
                    className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loadingPago}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingPago ? "Procesando..." : "Confirmar Pago"}
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
