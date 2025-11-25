import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { generarRecetaPDF } from "../../utils/generarRecetaPDF";

export default function CitasDoctor() {
  const location = useLocation();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [citaEnConsulta, setCitaEnConsulta] = useState(null);
  const [vistaAtencion, setVistaAtencion] = useState(false);
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [busquedaDiagnostico, setBusquedaDiagnostico] = useState("");
  const [diagnosticosSeleccionados, setDiagnosticosSeleccionados] = useState(
    []
  );
  const citaRefs = useRef({});

  // Estado para el formulario de consulta
  const [formularioConsulta, setFormularioConsulta] = useState({
    motivo_consulta: "",
    antecedentes: "",
    dolores_sintomas: "",
    atenciones_quirurgicas: "",
    evaluacion_doctor: "",
    tratamiento: "",
    diagnostico_ids: [],
    recetas: [],
  });

  const [nuevaReceta, setNuevaReceta] = useState({
    nombre: "",
    presentacion: "",
    dosis: "",
    duracion: "",
    cantidad: "",
  });

  // Estado para historial médico
  const [historialMedico, setHistorialMedico] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [consultasExpandidas, setConsultasExpandidas] = useState({});

  useEffect(() => {
    cargarDatos();
    cargarDiagnosticos();
  }, []);

  useEffect(() => {
    // Resaltar cita si viene desde el dashboard
    if (
      location.state?.highlightCitaId &&
      citaRefs.current[location.state.highlightCitaId]
    ) {
      citaRefs.current[location.state.highlightCitaId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      citaRefs.current[location.state.highlightCitaId].classList.add(
        "ring-4",
        "ring-blue-500"
      );
      setTimeout(() => {
        citaRefs.current[location.state.highlightCitaId]?.classList.remove(
          "ring-4",
          "ring-blue-500"
        );
      }, 2000);
    }
  }, [location.state, citas]);

  const cargarDatos = async () => {
    try {
      const doctorId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");
      const fechaHoy = new Date().toISOString().split("T")[0];

      console.log("🔍 DEBUG - Doctor ID:", doctorId);
      console.log("🔍 DEBUG - Fecha Hoy:", fechaHoy);
      console.log("🔍 DEBUG - Token:", token ? "Presente" : "Ausente");

      // Verificar si hay cita en consulta
      const enConsultaResponse = await fetch(
        `http://localhost:5000/Citas/doctor/${doctorId}/cita-en-consulta`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const enConsultaData = await enConsultaResponse.json();
      console.log("🔍 DEBUG - Cita en consulta:", enConsultaData);

      if (enConsultaData.cita_en_consulta) {
        // Cargar detalle completo de la cita en consulta
        const detalleResponse = await fetch(
          `http://localhost:5000/Citas/cita/${enConsultaData.cita_en_consulta}/detalle-completo`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const detalleData = await detalleResponse.json();
        setCitaEnConsulta(detalleData);
        setVistaAtencion(true);

        // Cargar historial médico del paciente
        if (detalleData.cita?.paciente?.id) {
          await cargarHistorialMedico(detalleData.cita.paciente.id);
        }

        // Cargar información de consulta si existe
        if (detalleData.informacion_consulta) {
          const diagnosticoIds = detalleData.informacion_consulta.diagnostico_id
            ? [detalleData.informacion_consulta.diagnostico_id]
            : [];

          setFormularioConsulta({
            motivo_consulta:
              detalleData.informacion_consulta.motivo_consulta || "",
            antecedentes: detalleData.informacion_consulta.antecedentes || "",
            dolores_sintomas:
              detalleData.informacion_consulta.dolores_sintomas || "",
            atenciones_quirurgicas:
              detalleData.informacion_consulta.atenciones_quirurgicas || "",
            evaluacion_doctor:
              detalleData.informacion_consulta.evaluacion_doctor || "",
            tratamiento: detalleData.informacion_consulta.tratamiento || "",
            diagnostico_ids: diagnosticoIds,
            recetas: detalleData.recetas || [],
          });

          setDiagnosticosSeleccionados(diagnosticoIds);
        }
      } else {
        // Cargar TODAS las citas del día (incluye Pendiente para mostrar las no pagadas)
        console.log("🔍 DEBUG - Buscando todas las citas del día...");
        const citasResponse = await fetch(
          `http://localhost:5000/Citas/doctor/${doctorId}/citas?fecha=${fechaHoy}&estados=Pendiente,Confirmada,Completada,Cancelada`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const citasData = await citasResponse.json();
        console.log("🔍 DEBUG - Respuesta citas:", citasData);
        console.log(
          "🔍 DEBUG - Cantidad de citas:",
          citasData.citas?.length || 0
        );
        setCitas(citasData.citas || []);
        setVistaAtencion(false);
      }
    } catch (error) {
      console.error("❌ Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDiagnosticos = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:5000/Citas/diagnosticos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDiagnosticos(data.diagnosticos || []);
    } catch (error) {
      console.error("Error al cargar diagnósticos:", error);
    }
  };

  const cargarHistorialMedico = async (pacienteId) => {
    setLoadingHistorial(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://localhost:5000/Citas/paciente/${pacienteId}/historial-medico`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setHistorialMedico(data.historial || []);
    } catch (error) {
      console.error("Error al cargar historial médico:", error);
      setHistorialMedico([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const toggleConsultaExpandida = (citaId) => {
    setConsultasExpandidas((prev) => ({
      ...prev,
      [citaId]: !prev[citaId],
    }));
  };

  const toggleDiagnostico = (diagnosticoId) => {
    setDiagnosticosSeleccionados((prev) => {
      if (prev.includes(diagnosticoId)) {
        return prev.filter((id) => id !== diagnosticoId);
      } else {
        return [...prev, diagnosticoId];
      }
    });
  };

  const aplicarDiagnosticos = () => {
    setFormularioConsulta({
      ...formularioConsulta,
      diagnostico_ids: diagnosticosSeleccionados,
    });
  };

  const eliminarDiagnostico = (diagnosticoId) => {
    setDiagnosticosSeleccionados((prev) =>
      prev.filter((id) => id !== diagnosticoId)
    );
    setFormularioConsulta({
      ...formularioConsulta,
      diagnostico_ids: formularioConsulta.diagnostico_ids.filter(
        (id) => id !== diagnosticoId
      ),
    });
  };

  const limpiarSeleccionDiagnosticos = () => {
    setDiagnosticosSeleccionados([]);
    setBusquedaDiagnostico("");
  };

  const diagnosticosFiltrados = diagnosticos.filter((diag) =>
    diag.nombre_enfermedad
      .toLowerCase()
      .includes(busquedaDiagnostico.toLowerCase())
  );

  const iniciarConsulta = async (citaId) => {
    try {
      const token = localStorage.getItem("access_token");

      // Cambiar estado a "En Consulta"
      await fetch(`http://localhost:5000/Citas/cita/${citaId}/cambiar-estado`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: "En Consulta" }),
      });

      // Recargar datos
      await cargarDatos();
    } catch (error) {
      console.error("Error al iniciar consulta:", error);
      alert("Error al iniciar la consulta");
    }
  };

  const guardarBorrador = async () => {
    try {
      const token = localStorage.getItem("access_token");

      await fetch(
        `http://localhost:5000/Citas/cita/${citaEnConsulta.cita.id}/guardar-consulta`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formularioConsulta),
        }
      );

      alert("Borrador guardado exitosamente");
    } catch (error) {
      console.error("Error al guardar borrador:", error);
      alert("Error al guardar el borrador");
    }
  };

  const finalizarConsulta = async () => {
    if (
      !confirm(
        "¿Está seguro de finalizar esta consulta? No podrá modificarla después."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");

      // Guardar información final
      await fetch(
        `http://localhost:5000/Citas/cita/${citaEnConsulta.cita.id}/guardar-consulta`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formularioConsulta),
        }
      );

      // Cambiar estado a "Completada"
      await fetch(
        `http://localhost:5000/Citas/cita/${citaEnConsulta.cita.id}/cambiar-estado`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ estado: "Completada" }),
        }
      );

      alert("Consulta finalizada exitosamente");

      // Resetear vista
      setCitaEnConsulta(null);
      setVistaAtencion(false);
      setFormularioConsulta({
        motivo_consulta: "",
        antecedentes: "",
        dolores_sintomas: "",
        atenciones_quirurgicas: "",
        evaluacion_doctor: "",
        tratamiento: "",
        diagnostico_ids: [],
        recetas: [],
      });

      // Recargar citas
      await cargarDatos();
    } catch (error) {
      console.error("Error al finalizar consulta:", error);
      alert("Error al finalizar la consulta");
    }
  };

  const agregarReceta = () => {
    if (!nuevaReceta.nombre) {
      alert("Debe ingresar al menos el nombre del medicamento");
      return;
    }

    setFormularioConsulta({
      ...formularioConsulta,
      recetas: [...formularioConsulta.recetas, nuevaReceta],
    });

    setNuevaReceta({
      nombre: "",
      presentacion: "",
      dosis: "",
      duracion: "",
      cantidad: "",
    });
  };

  const handleGenerarReceta = async () => {
    try {
      // Validar que haya recetas
      if (
        !formularioConsulta.recetas ||
        formularioConsulta.recetas.length === 0
      ) {
        alert("Debe agregar al menos un medicamento para generar la receta");
        return;
      }

      // Obtener nombres de diagnósticos
      const nombresDiagnosticos = formularioConsulta.diagnostico_ids
        .map((id) => {
          const diag = diagnosticos.find((d) => d.id === id);
          return diag ? diag.nombre_enfermedad : null;
        })
        .filter(Boolean);

      // Datos del doctor - Acceder correctamente desde citaEnConsulta.cita.doctor
      const doctor = citaEnConsulta?.cita?.doctor;
      const doctorData = {
        nombre: `${
          doctor?.nombre ||
          localStorage.getItem("user_name") ||
          "Dr. Sin nombre"
        } ${doctor?.apellido_paterno || ""} ${
          doctor?.apellido_materno || ""
        }`.trim(),
        especialidad:
          citaEnConsulta?.doctor?.especialidad || "Medicina General",
        rut: doctor?.rut || "N/A",
      };

      // Datos del paciente - Acceder correctamente desde citaEnConsulta.cita.paciente
      const paciente = citaEnConsulta?.cita?.paciente;
      const pacienteData = {
        nombre: `${paciente?.nombre || ""} ${
          paciente?.apellido_paterno || ""
        } ${paciente?.apellido_materno || ""}`.trim(),
        rut: paciente?.rut || "N/A",
        fecha_nacimiento: paciente?.fecha_nacimiento || null,
      };

      console.log("🔍 DEBUG - citaEnConsulta completo:", citaEnConsulta);
      console.log("🔍 DEBUG - Doctor extraído:", doctor);
      console.log("🔍 DEBUG - Paciente extraído:", paciente);
      console.log("🔍 DEBUG - Datos doctor para PDF:", doctorData);
      console.log("🔍 DEBUG - Datos paciente para PDF:", pacienteData);

      // Generar PDF
      await generarRecetaPDF({
        paciente: pacienteData,
        doctor: doctorData,
        recetas: formularioConsulta.recetas,
        diagnosticos: nombresDiagnosticos,
        consulta: {
          tratamiento: formularioConsulta.tratamiento,
        },
      });
    } catch (error) {
      console.error("Error al generar receta:", error);
      alert("Error al generar la receta PDF");
    }
  };

  const eliminarReceta = (index) => {
    const nuevasRecetas = formularioConsulta.recetas.filter(
      (_, i) => i !== index
    );
    setFormularioConsulta({
      ...formularioConsulta,
      recetas: nuevasRecetas,
    });
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return "N/A";
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Completada":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
      case "En Consulta":
        return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
      case "Confirmada":
        return "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800";
      case "Pendiente":
        return "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
      case "Cancelada":
        return "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800";
    }
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

  // Vista de Atención al Paciente
  if (vistaAtencion && citaEnConsulta) {
    const paciente = citaEnConsulta.cita.paciente;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Premium */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 rounded-2xl shadow-xl"
          >
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
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                    <span className="text-3xl font-bold text-white">
                      {paciente.nombre?.charAt(0)}
                      {paciente.apellido_paterno?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {paciente.nombre} {paciente.apellido_paterno}{" "}
                      {paciente.apellido_materno}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-blue-100">
                      <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                          />
                        </svg>
                        RUT: {paciente.rut}
                      </span>
                      <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg">
                        <svg
                          className="w-4 h-4"
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
                        {paciente.fecha_nacimiento
                          ? new Date().getFullYear() -
                            new Date(paciente.fecha_nacimiento).getFullYear()
                          : "N/A"}{" "}
                        años
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 border-2 border-emerald-400/50 backdrop-blur-sm rounded-xl">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-white font-semibold">
                      En Consulta
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setVistaAtencion(false)}
                    className="px-6 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white font-medium transition-all flex items-center gap-2"
                  >
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
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Volver a Citas
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Layout Grid 50/50 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PANEL IZQUIERDO - Consulta Actual */}
            <div className="space-y-6">
              {/* Información del Paciente */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Datos del Paciente
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      RUT
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {paciente.rut || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Edad
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {calcularEdad(paciente.fecha_nacimiento)} años
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Sexo
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {paciente.sexo || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Teléfono
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {paciente.telefono || "N/A"}
                    </p>
                  </div>
                  {paciente.alergias && (
                    <div className="col-span-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        ⚠️ Alergias
                      </p>
                      <p className="font-semibold text-red-900 dark:text-red-200 text-sm mt-1">
                        {paciente.alergias}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Formulario de Consulta */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-600"
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
                  Información de Consulta
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Motivo de Consulta
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white text-sm"
                      rows="2"
                      value={formularioConsulta.motivo_consulta}
                      onChange={(e) =>
                        setFormularioConsulta({
                          ...formularioConsulta,
                          motivo_consulta: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Antecedentes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white text-sm"
                      rows="2"
                      value={formularioConsulta.antecedentes}
                      onChange={(e) =>
                        setFormularioConsulta({
                          ...formularioConsulta,
                          antecedentes: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dolores y Síntomas
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white text-sm"
                      rows="2"
                      placeholder="Si no aplica, dejar vacío"
                      value={formularioConsulta.dolores_sintomas}
                      onChange={(e) =>
                        setFormularioConsulta({
                          ...formularioConsulta,
                          dolores_sintomas: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Atenciones Quirúrgicas Previas
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white text-sm"
                      rows="2"
                      placeholder="Si no aplica, dejar vacío"
                      value={formularioConsulta.atenciones_quirurgicas}
                      onChange={(e) =>
                        setFormularioConsulta({
                          ...formularioConsulta,
                          atenciones_quirurgicas: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Evaluación del Doctor
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white text-sm"
                      rows="2"
                      value={formularioConsulta.evaluacion_doctor}
                      onChange={(e) =>
                        setFormularioConsulta({
                          ...formularioConsulta,
                          evaluacion_doctor: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tratamiento
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white text-sm"
                      rows="2"
                      value={formularioConsulta.tratamiento}
                      onChange={(e) =>
                        setFormularioConsulta({
                          ...formularioConsulta,
                          tratamiento: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Diagnósticos
                    </label>

                    {/* Diagnósticos ya seleccionados */}
                    {formularioConsulta.diagnostico_ids.length > 0 && (
                      <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="text-xs font-semibold text-green-800 dark:text-green-300 mb-1">
                          Diagnósticos asignados:
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {formularioConsulta.diagnostico_ids.map((id) => {
                            const diag = diagnosticos.find((d) => d.id === id);
                            return diag ? (
                              <div
                                key={id}
                                className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 rounded-full text-xs"
                              >
                                <span>{diag.nombre_enfermedad}</span>
                                <button
                                  type="button"
                                  onClick={() => eliminarDiagnostico(id)}
                                  className="hover:bg-green-200 dark:hover:bg-green-700 rounded-full p-0.5 transition-colors"
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
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Buscador */}
                    <div className="mb-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar enfermedad..."
                          value={busquedaDiagnostico}
                          onChange={(e) =>
                            setBusquedaDiagnostico(e.target.value)
                          }
                          className="w-full px-3 py-2 pl-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white text-sm"
                        />
                        <svg
                          className="absolute left-2 top-2.5 w-4 h-4 text-gray-400"
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

                    {/* Lista de diagnósticos con checkboxes */}
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 max-h-40 overflow-y-auto">
                      {diagnosticosFiltrados.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-gray-600">
                          {diagnosticosFiltrados.map((diag) => (
                            <label
                              key={diag.id}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={diagnosticosSeleccionados.includes(
                                  diag.id
                                )}
                                onChange={() => toggleDiagnostico(diag.id)}
                                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                {diag.nombre_enfermedad}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-xs">
                          {busquedaDiagnostico
                            ? "No se encontraron diagnósticos"
                            : "No hay diagnósticos disponibles"}
                        </div>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={aplicarDiagnosticos}
                        disabled={diagnosticosSeleccionados.length === 0}
                        className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-xs"
                      >
                        Asignar ({diagnosticosSeleccionados.length})
                      </button>
                      <button
                        type="button"
                        onClick={limpiarSeleccionDiagnosticos}
                        className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-xs"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recetas */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  Receta Médica
                </h2>

                {/* Lista de medicamentos agregados */}
                {formularioConsulta.recetas.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {formularioConsulta.recetas.map((receta, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {receta.nombre}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {receta.presentacion} - {receta.dosis} -{" "}
                            {receta.duracion} - {receta.cantidad} cajas
                          </p>
                        </div>
                        <button
                          onClick={() => eliminarReceta(index)}
                          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulario para agregar medicamento */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre del Medicamento *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white text-sm"
                      value={nuevaReceta.nombre}
                      onChange={(e) =>
                        setNuevaReceta({
                          ...nuevaReceta,
                          nombre: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Presentación
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Comprimidos"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white text-sm"
                      value={nuevaReceta.presentacion}
                      onChange={(e) =>
                        setNuevaReceta({
                          ...nuevaReceta,
                          presentacion: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dosis
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 1 cada 8 horas"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white text-sm"
                      value={nuevaReceta.dosis}
                      onChange={(e) =>
                        setNuevaReceta({
                          ...nuevaReceta,
                          dosis: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duración
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 7 días"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white text-sm"
                      value={nuevaReceta.duracion}
                      onChange={(e) =>
                        setNuevaReceta({
                          ...nuevaReceta,
                          duracion: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cantidad de Cajas
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 2"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white text-sm"
                      value={nuevaReceta.cantidad}
                      onChange={(e) =>
                        setNuevaReceta({
                          ...nuevaReceta,
                          cantidad: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <button
                  onClick={agregarReceta}
                  className="mt-3 w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  + Agregar Medicamento
                </button>
              </div>

              {/* Botones de Acción */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleGenerarReceta}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
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
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    <span className="text-sm">Generar PDF</span>
                  </button>
                  <button
                    onClick={guardarBorrador}
                    className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors text-sm"
                  >
                    💾 Guardar Borrador
                  </button>
                  <button
                    onClick={finalizarConsulta}
                    className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-sm"
                  >
                    ✓ Finalizar Consulta
                  </button>
                </div>
              </div>
            </div>

            {/* PANEL DERECHO - Historial Médico */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 h-full">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-indigo-600"
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
                  Historial Médico
                  <span className="ml-auto text-sm font-normal text-gray-500">
                    {historialMedico.length} consulta
                    {historialMedico.length !== 1 ? "s" : ""}
                  </span>
                </h2>

                {/* Loading State */}
                {loadingHistorial && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                )}

                {/* Empty State */}
                {!loadingHistorial && historialMedico.length === 0 && (
                  <div className="text-center py-12">
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
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      Sin historial
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Este paciente no tiene consultas previas registradas.
                    </p>
                  </div>
                )}

                {/* Lista de Consultas Previas */}
                {!loadingHistorial && historialMedico.length > 0 && (
                  <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                    {historialMedico.map((consulta) => (
                      <motion.div
                        key={consulta.cita_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        {/* Header de la Consulta */}
                        <button
                          onClick={() =>
                            toggleConsultaExpandida(consulta.cita_id)
                          }
                          className="w-full px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-colors flex items-center justify-between"
                        >
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {new Date(
                                  consulta.fecha_atencion
                                ).toLocaleDateString("es-CL", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </span>
                              {consulta.especialidad && (
                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs">
                                  {consulta.especialidad.nombre}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Dr. {consulta.doctor?.nombre}{" "}
                              {consulta.doctor?.apellido_paterno}{" "}
                              {consulta.doctor?.apellido_materno}
                            </p>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-500 transition-transform ${
                              consultasExpandidas[consulta.cita_id]
                                ? "rotate-180"
                                : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {/* Contenido Expandible */}
                        <AnimatePresence>
                          {consultasExpandidas[consulta.cita_id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 py-3 bg-white dark:bg-gray-800 space-y-3">
                                {/* Motivo de Consulta */}
                                {consulta.informacion_consulta
                                  ?.motivo_consulta && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                      Motivo de Consulta
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                      {
                                        consulta.informacion_consulta
                                          .motivo_consulta
                                      }
                                    </p>
                                  </div>
                                )}

                                {/* Antecedentes */}
                                {consulta.informacion_consulta
                                  ?.antecedentes && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                      Antecedentes
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                      {
                                        consulta.informacion_consulta
                                          .antecedentes
                                      }
                                    </p>
                                  </div>
                                )}

                                {/* Síntomas */}
                                {consulta.informacion_consulta
                                  ?.dolores_sintomas && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                      Síntomas
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                      {
                                        consulta.informacion_consulta
                                          .dolores_sintomas
                                      }
                                    </p>
                                  </div>
                                )}

                                {/* Evaluación */}
                                {consulta.informacion_consulta
                                  ?.evaluacion_doctor && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                      Evaluación Médica
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                      {
                                        consulta.informacion_consulta
                                          .evaluacion_doctor
                                      }
                                    </p>
                                  </div>
                                )}

                                {/* Diagnóstico */}
                                {consulta.informacion_consulta?.diagnostico && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                      Diagnóstico
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                                        {
                                          consulta.informacion_consulta
                                            .diagnostico.nombre_enfermedad
                                        }
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Tratamiento */}
                                {consulta.informacion_consulta?.tratamiento && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                      Tratamiento
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                      {
                                        consulta.informacion_consulta
                                          .tratamiento
                                      }
                                    </p>
                                  </div>
                                )}

                                {/* Recetas */}
                                {consulta.recetas &&
                                  consulta.recetas.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Medicamentos Recetados
                                      </p>
                                      <div className="space-y-2">
                                        {consulta.recetas.map((receta, idx) => (
                                          <div
                                            key={idx}
                                            className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded border border-purple-200 dark:border-purple-800"
                                          >
                                            <p className="text-xs font-semibold text-purple-900 dark:text-purple-100">
                                              {receta.nombre}
                                            </p>
                                            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                                              {receta.presentacion} •{" "}
                                              {receta.dosis}
                                            </p>
                                            <p className="text-xs text-purple-600 dark:text-purple-400">
                                              Duración: {receta.duracion} •
                                              Cantidad: {receta.cantidad}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de Lista de Citas
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Profesional */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Mis Citas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Gestión de citas médicas del día • {citas.length} cita
              {citas.length !== 1 ? "s" : ""} programada
              {citas.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
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
        </motion.div>

        {citas.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-12"
          >
            <div className="text-center">
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Sin citas programadas
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                No hay consultas agendadas para el día de hoy
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Sección: Pacientes Pendientes de Pago */}
            {citas.filter(
              (c) =>
                c.estado_actual === "Pendiente" ||
                c.estado_actual === "Confirmada"
            ).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                      <svg
                        className="w-5 h-5 text-white"
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
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Pacientes del Día
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {
                          citas.filter(
                            (c) =>
                              c.estado_actual === "Pendiente" ||
                              c.estado_actual === "Confirmada"
                          ).length
                        }{" "}
                        paciente(s) esperando atención
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {citas
                    .filter(
                      (c) =>
                        c.estado_actual === "Pendiente" ||
                        c.estado_actual === "Confirmada"
                    )
                    .map((cita, index) => (
                      <motion.div
                        key={cita.id}
                        ref={(el) => (citaRefs.current[cita.id] = el)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all group"
                      >
                        <div className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                            {/* Time Badge - Amber for pending */}
                            <div className="flex-shrink-0">
                              <div
                                className={`${
                                  cita.estado_actual === "Confirmada"
                                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                                    : "bg-gradient-to-br from-amber-500 to-amber-600"
                                } text-white rounded-xl p-4 shadow-md group-hover:shadow-lg transition-shadow min-w-[100px] text-center`}
                              >
                                <div className="text-3xl font-bold leading-none mb-1">
                                  {new Date(
                                    cita.fecha_atencion
                                  ).toLocaleTimeString("es-CL", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                                <div className="text-xs opacity-90">
                                  {new Date(
                                    cita.fecha_atencion
                                  ).toLocaleDateString("es-CL", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Patient Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-lg font-bold text-gray-700 dark:text-gray-200">
                                    {cita.paciente.nombre?.charAt(0)}
                                    {cita.paciente.apellido_paterno?.charAt(0)}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                                    {cita.paciente.nombre}{" "}
                                    {cita.paciente.apellido_paterno}{" "}
                                    {cita.paciente.apellido_materno}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                      </svg>
                                      {calcularEdad(
                                        cita.paciente.fecha_nacimiento
                                      )}{" "}
                                      años
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                      {cita.motivo_consulta ||
                                        "Sin motivo especificado"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Status & Actions */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
                              <span
                                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${getEstadoColor(
                                  cita.estado_actual
                                )}`}
                              >
                                {cita.estado_actual}
                              </span>
                              {cita.estado_actual === "Confirmada" && (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => iniciarConsulta(cita.id)}
                                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                                >
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
                                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  Iniciar Consulta
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* Sección: Pacientes Atendidos */}
            {citas.filter(
              (c) =>
                c.estado_actual === "Completada" ||
                c.estado_actual === "Cancelada"
            ).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
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
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Pacientes Atendidos
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {
                          citas.filter((c) => c.estado_actual === "Completada")
                            .length
                        }{" "}
                        completada(s) •{" "}
                        {
                          citas.filter((c) => c.estado_actual === "Cancelada")
                            .length
                        }{" "}
                        cancelada(s)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {citas
                    .filter(
                      (c) =>
                        c.estado_actual === "Completada" ||
                        c.estado_actual === "Cancelada"
                    )
                    .map((cita, index) => (
                      <motion.div
                        key={cita.id}
                        ref={(el) => (citaRefs.current[cita.id] = el)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-all opacity-75 hover:opacity-100"
                      >
                        <div className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                            {/* Time Badge - Gray for completed */}
                            <div className="flex-shrink-0">
                              <div className="bg-gradient-to-br from-gray-400 to-gray-500 text-white rounded-xl p-4 shadow-sm min-w-[100px] text-center">
                                <div className="text-3xl font-bold leading-none mb-1">
                                  {new Date(
                                    cita.fecha_atencion
                                  ).toLocaleTimeString("es-CL", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                                <div className="text-xs opacity-90">
                                  {new Date(
                                    cita.fecha_atencion
                                  ).toLocaleDateString("es-CL", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Patient Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-lg font-bold text-gray-700 dark:text-gray-200">
                                    {cita.paciente.nombre?.charAt(0)}
                                    {cita.paciente.apellido_paterno?.charAt(0)}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                                    {cita.paciente.nombre}{" "}
                                    {cita.paciente.apellido_paterno}{" "}
                                    {cita.paciente.apellido_materno}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                      </svg>
                                      {calcularEdad(
                                        cita.paciente.fecha_nacimiento
                                      )}{" "}
                                      años
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                      {cita.motivo_consulta ||
                                        "Sin motivo especificado"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Status Only */}
                            <div className="flex-shrink-0">
                              <span
                                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${getEstadoColor(
                                  cita.estado_actual
                                )}`}
                              >
                                {cita.estado_actual}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
