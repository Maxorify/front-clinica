import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
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
        // Cargar citas del día (Confirmada, Completada, Cancelada)
        console.log("🔍 DEBUG - Buscando citas confirmadas...");
        const citasResponse = await fetch(
          `http://localhost:5000/Citas/doctor/${doctorId}/citas?fecha=${fechaHoy}&estados=Confirmada,Completada,Cancelada`,
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
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Confirmada":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "Cancelada":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl text-gray-600 dark:text-gray-400">
          Cargando...
        </div>
      </div>
    );
  }

  // Vista de Atención al Paciente
  if (vistaAtencion && citaEnConsulta) {
    const paciente = citaEnConsulta.cita.paciente;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Atención al Paciente
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {paciente.nombre} {paciente.apellido_paterno}{" "}
                {paciente.apellido_materno}
              </p>
            </div>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-medium">
              En Consulta
            </span>
          </div>
        </div>

        {/* Información del Paciente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Datos del Paciente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">RUT</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {paciente.rut || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Edad</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {calcularEdad(paciente.fecha_nacimiento)} años
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sexo</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {paciente.sexo || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Estado Civil
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {paciente.estado_civil || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Teléfono
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {paciente.telefono || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Correo</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {paciente.correo || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dirección
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {paciente.direccion || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ocupación
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {paciente.ocupacion || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Persona Responsable
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {paciente.persona_responsable || "N/A"}
              </p>
            </div>
            <div className="md:col-span-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Alergias
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {paciente.alergias || "Sin alergias registradas"}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de Consulta */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Información de Consulta
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivo de Consulta
              </label>
              <textarea
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                rows="3"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Antecedentes
              </label>
              <textarea
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                rows="3"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dolores y Síntomas
              </label>
              <textarea
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Atenciones Quirúrgicas Previas
              </label>
              <textarea
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Evaluación del Doctor
              </label>
              <textarea
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                rows="3"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tratamiento
              </label>
              <textarea
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                rows="3"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Diagnósticos
              </label>

              {/* Diagnósticos ya seleccionados */}
              {formularioConsulta.diagnostico_ids.length > 0 && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                    Diagnósticos asignados:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {formularioConsulta.diagnostico_ids.map((id) => {
                      const diag = diagnosticos.find((d) => d.id === id);
                      return diag ? (
                        <div
                          key={id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 rounded-full text-sm"
                        >
                          <span>{diag.nombre_enfermedad}</span>
                          <button
                            type="button"
                            onClick={() => eliminarDiagnostico(id)}
                            className="hover:bg-green-200 dark:hover:bg-green-700 rounded-full p-0.5 transition-colors"
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
              <div className="mb-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar enfermedad..."
                    value={busquedaDiagnostico}
                    onChange={(e) => setBusquedaDiagnostico(e.target.value)}
                    className="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  />
                  <svg
                    className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
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
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 max-h-64 overflow-y-auto">
                {diagnosticosFiltrados.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {diagnosticosFiltrados.map((diag) => (
                      <label
                        key={diag.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={diagnosticosSeleccionados.includes(diag.id)}
                          onChange={() => toggleDiagnostico(diag.id)}
                          className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {diag.nombre_enfermedad}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {busquedaDiagnostico
                      ? "No se encontraron diagnósticos"
                      : "No hay diagnósticos disponibles"}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={aplicarDiagnosticos}
                  disabled={diagnosticosSeleccionados.length === 0}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Asignar seleccionados ({diagnosticosSeleccionados.length})
                </button>
                <button
                  type="button"
                  onClick={limpiarSeleccionDiagnosticos}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Limpiar
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Selecciona una o más enfermedades y presiona "Asignar
                seleccionados"
              </p>
            </div>
          </div>
        </div>

        {/* Recetas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Receta Médica
          </h2>

          {/* Lista de medicamentos agregados */}
          {formularioConsulta.recetas.length > 0 && (
            <div className="mb-6 space-y-2">
              {formularioConsulta.recetas.map((receta, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {receta.nombre}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {receta.presentacion} - {receta.dosis} - {receta.duracion}{" "}
                      - {receta.cantidad} cajas
                    </p>
                  </div>
                  <button
                    onClick={() => eliminarReceta(index)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Formulario para agregar medicamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Medicamento *
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                value={nuevaReceta.nombre}
                onChange={(e) =>
                  setNuevaReceta({ ...nuevaReceta, nombre: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Presentación
              </label>
              <input
                type="text"
                placeholder="Ej: Comprimidos, Jarabe, etc."
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dosis
              </label>
              <input
                type="text"
                placeholder="Ej: 1 cada 8 horas"
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                value={nuevaReceta.dosis}
                onChange={(e) =>
                  setNuevaReceta({ ...nuevaReceta, dosis: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración
              </label>
              <input
                type="text"
                placeholder="Ej: 7 días"
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                value={nuevaReceta.duracion}
                onChange={(e) =>
                  setNuevaReceta({ ...nuevaReceta, duracion: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cantidad de Cajas
              </label>
              <input
                type="text"
                placeholder="Ej: 2"
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                value={nuevaReceta.cantidad}
                onChange={(e) =>
                  setNuevaReceta({ ...nuevaReceta, cantidad: e.target.value })
                }
              />
            </div>
          </div>

          <button
            onClick={agregarReceta}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Agregar Medicamento
          </button>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-4">
          <button
            onClick={handleGenerarReceta}
            className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
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
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Generar Receta PDF
          </button>
          <button
            onClick={guardarBorrador}
            className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors"
          >
            Guardar Borrador
          </button>
          <button
            onClick={finalizarConsulta}
            className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
          >
            Finalizar Consulta
          </button>
        </div>
      </div>
    );
  }

  // Vista de Lista de Citas
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Mis Citas
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gestión de citas médicas del día
        </p>
      </div>

      {citas.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <p className="text-xl text-gray-500 dark:text-gray-400">
            No hay citas para hoy
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {citas.map((cita) => (
            <div
              key={cita.id}
              ref={(el) => (citaRefs.current[cita.id] = el)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-green-500 text-white rounded-lg px-4 py-3 text-center">
                    <div className="text-2xl font-bold">
                      {
                        new Date(cita.fecha_atencion)
                          .toLocaleTimeString("es-CL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          .split(":")[0]
                      }
                    </div>
                    <div className="text-xs">
                      {
                        new Date(cita.fecha_atencion)
                          .toLocaleTimeString("es-CL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          .split(":")[1]
                      }
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {cita.paciente.nombre} {cita.paciente.apellido_paterno}{" "}
                      {cita.paciente.apellido_materno}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {calcularEdad(cita.paciente.fecha_nacimiento)} años -{" "}
                      {cita.motivo_consulta || "Sin motivo especificado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                      cita.estado_actual
                    )}`}
                  >
                    {cita.estado_actual}
                  </span>
                  {cita.estado_actual === "Confirmada" && (
                    <button
                      onClick={() => iniciarConsulta(cita.id)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      Iniciar Consulta
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
