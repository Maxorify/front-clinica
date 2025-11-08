import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_URL = "http://localhost:5000";

export default function Doctores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [doctores, setDoctores] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tempPassword, setTempPassword] = useState("");

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalDoctores, setTotalDoctores] = useState(0);
  const pageSize = 6; // 6 doctores por página

  const [formData, setFormData] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    rut: "",
    email: "",
    celular: "",
    cel_secundario: "",
    direccion: "",
    especialidades_ids: [], // Array de IDs de especialidades
    rol_id: 2, // Rol de doctor
  });

  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("");

  // Formatear RUT mientras se escribe
  const formatearRut = (rut) => {
    const cleaned = rut.replace(/[^0-9kK]/g, "");
    if (cleaned.length <= 1) return cleaned;
    const dv = cleaned.slice(-1);
    let numbers = cleaned.slice(0, -1);
    numbers = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return numbers ? `${numbers}-${dv}` : "";
  };

  // Limpiar RUT (remover puntos y guión)
  const limpiarRut = (rut) => {
    return rut.replace(/[.\-]/g, "");
  };

  // Generar clave temporal
  const generarClaveTemporal = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Cargar especialidades solo al montar
  useEffect(() => {
    cargarEspecialidades();
  }, []);

  // Cargar doctores cuando cambia la página o búsqueda
  useEffect(() => {
    cargarDoctores();
  }, [currentPage, searchTerm]);

  // Ocultar automáticamente la notificación después de unos segundos
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const showNotification = (type, message) => {
    setNotification({ id: Date.now(), type, message });
  };

  const cargarDoctores = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        page_size: pageSize,
      };

      // Agregar búsqueda si existe
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await axios.get(
        `${API_URL}/Usuarios/listar-doctores-paginado`,
        { params }
      );

      setDoctores(response.data?.doctores || []);
      setTotalDoctores(response.data?.total || 0);
      setTotalPages(response.data?.total_pages || 0);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error al cargar doctores:", error);
        showNotification("error", "Error al cargar doctores");
      }
      setDoctores([]);
      setTotalDoctores(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const cargarEspecialidades = async () => {
    try {
      const response = await axios.get(`${API_URL}/doctores/especialidades`);
      setEspecialidades(response.data.especialidades || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error al cargar especialidades:", error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "rut") {
      const rutFormateado = formatearRut(value);
      setFormData({ ...formData, [name]: rutFormateado });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Agregar especialidad al doctor
  const agregarEspecialidad = () => {
    if (!especialidadSeleccionada) return;

    const espId = parseInt(especialidadSeleccionada);
    if (formData.especialidades_ids.includes(espId)) {
      showNotification("error", "Esta especialidad ya está agregada");
      return;
    }

    setFormData({
      ...formData,
      especialidades_ids: [...formData.especialidades_ids, espId],
    });
    setEspecialidadSeleccionada("");
  };

  // Eliminar especialidad del doctor
  const eliminarEspecialidad = (espId) => {
    setFormData({
      ...formData,
      especialidades_ids: formData.especialidades_ids.filter(
        (id) => id !== espId
      ),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Preparar datos base
      const dataBase = {
        nombre: formData.nombre,
        apellido_paterno: formData.apellido_paterno,
        apellido_materno: formData.apellido_materno,
        rut: limpiarRut(formData.rut),
        email: formData.email,
        celular: formData.celular,
        cel_secundario: formData.cel_secundario || "",
        direccion: formData.direccion,
        rol_id: 2,
        especialidades_ids: formData.especialidades_ids, // Enviar array de especialidades
      };

      if (editingId) {
        // Actualizar doctor - NO enviar contraseña_temporal
        await axios.put(
          `${API_URL}/Usuarios/modificar-usuario/${editingId}`,
          dataBase
        );
        showNotification("success", "Doctor actualizado correctamente");
      } else {
        // Crear nuevo doctor con contraseña temporal
        const claveTemp = generarClaveTemporal();
        const dataToSend = {
          ...dataBase,
          contraseña_temporal: claveTemp,
        };

        await axios.post(`${API_URL}/Usuarios/crear-usuario`, dataToSend);
        showNotification("success", "Doctor creado correctamente");

        // Mostrar la clave temporal generada
        setTempPassword(claveTemp);
        setShowPasswordModal(true);
      }

      await cargarDoctores();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar doctor:", error);
      showNotification(
        "error",
        error.response?.data?.detail || "Error al guardar doctor"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (doctor) => {
    setEditingId(doctor.id);
    setFormData({
      nombre: doctor.nombre || "",
      apellido_paterno: doctor.apellido_paterno || "",
      apellido_materno: doctor.apellido_materno || "",
      rut: formatearRut(doctor.rut || ""),
      email: doctor.email || "",
      celular: doctor.celular || "",
      cel_secundario: doctor.cel_secundario || "",
      direccion: doctor.direccion || "",
      especialidades_ids: doctor.especialidades_ids || [], // Cargar array de especialidades
      rol_id: 2,
    });
    setShowModal(true);
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Está seguro de eliminar al doctor ${nombre}?`)) return;

    try {
      await axios.delete(`${API_URL}/Usuarios/eliminar-usuario/${id}`);
      showNotification("success", "Doctor eliminado correctamente");
      await cargarDoctores();
    } catch (error) {
      console.error("Error al eliminar doctor:", error);
      showNotification(
        "error",
        error.response?.data?.detail || "Error al eliminar doctor"
      );
    }
  };

  const handleGenerarClave = async (doctorId) => {
    try {
      // Primero verificar si ya existe una clave temporal
      const responseExistente = await axios.get(
        `${API_URL}/Usuarios/obtener-clave-temporal/${doctorId}`
      );

      if (responseExistente.data.tiene_clave) {
        // Ya existe una clave temporal, mostrarla
        setTempPassword(responseExistente.data.contraseña_temporal);
        setShowPasswordModal(true);
        showNotification("info", "Mostrando clave temporal existente");
      } else {
        // No existe, generar una nueva
        const claveTemp = generarClaveTemporal();

        // Llamar al endpoint para guardar la clave temporal en la BD
        await axios.post(
          `${API_URL}/Usuarios/generar-clave-temporal/${doctorId}`,
          null,
          { params: { contraseña_temporal: claveTemp } }
        );

        setTempPassword(claveTemp);
        setShowPasswordModal(true);
        showNotification("success", "Clave temporal generada correctamente");
      }
    } catch (error) {
      console.error("Error al manejar clave temporal:", error);
      showNotification("error", "Error al obtener/generar clave temporal");
    }
  };

  const copiarClave = () => {
    navigator.clipboard.writeText(tempPassword);
    showNotification("success", "Clave copiada al portapapeles");
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      nombre: "",
      apellido_paterno: "",
      apellido_materno: "",
      rut: "",
      email: "",
      celular: "",
      cel_secundario: "",
      direccion: "",
      especialidades_ids: [],
      rol_id: 2,
    });
    setEspecialidadSeleccionada("");
  };

  const cerrarPasswordModal = () => {
    setShowPasswordModal(false);
    setTempPassword("");
  };

  // Resetear a página 1 cuando cambia el término de búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Funciones de navegación de paginación
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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
                  : notification.type === "info"
                  ? "border-blue-500"
                  : "border-red-500"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full ${
                    notification.type === "success"
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100"
                      : notification.type === "info"
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100"
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
                  ) : notification.type === "info" ? (
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
                  aria-label="Cerrar notificación"
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
              Doctores
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestión de médicos de la clínica
            </p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-lg"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Nuevo Doctor
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre, RUT o email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-3 pl-12 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
            />
            <svg
              className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold opacity-90">Total Doctores</h3>
            <p className="text-4xl font-bold mt-2">{totalDoctores}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold opacity-90">Página Actual</h3>
            <p className="text-4xl font-bold mt-2">
              {currentPage} / {totalPages || 1}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold opacity-90">Especialidades</h3>
            <p className="text-4xl font-bold mt-2">{especialidades.length}</p>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {doctores.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {doctor.nombre?.charAt(0)}
                    {doctor.apellido_paterno?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {doctor.nombre || ""} {doctor.apellido_paterno || ""}{" "}
                      {doctor.apellido_materno || ""}
                    </h3>
                    {/* Mostrar especialidades como tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doctor.especialidades_ids &&
                      doctor.especialidades_ids.length > 0 ? (
                        doctor.especialidades_ids.map((espId) => {
                          const esp = especialidades.find(
                            (e) => e.id === espId
                          );
                          return esp ? (
                            <span
                              key={espId}
                              className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                            >
                              {esp.nombre}
                            </span>
                          ) : null;
                        })
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Sin especialidades
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
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
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>{String(doctor.celular || "Sin teléfono")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{String(doctor.email || "Sin email")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
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
                      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                    />
                  </svg>
                  <span>
                    {doctor.rut ? formatearRut(String(doctor.rut)) : "Sin RUT"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleEdit(doctor)}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleGenerarClave(doctor.id)}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Clave Temporal
                </button>
                <button
                  onClick={() =>
                    handleDelete(
                      doctor.id,
                      `${doctor.nombre} ${doctor.apellido_paterno}`
                    )
                  }
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {doctores.length === 0 && !loading && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              No se encontraron doctores
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Cargando doctores...
            </p>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {/* Información de página */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {doctores.length}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {totalDoctores}
                </span>{" "}
                doctores
              </div>

              {/* Controles de paginación */}
              <div className="flex items-center gap-2">
                {/* Botón Primera Página */}
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Primera página"
                >
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* Botón Anterior */}
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300 font-medium"
                >
                  Anterior
                </button>

                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Mostrar siempre primera y última página
                      if (page === 1 || page === totalPages) return true;
                      // Mostrar páginas cercanas a la actual
                      return Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center">
                        {/* Mostrar "..." si hay gap */}
                        {index > 0 && page - array[index - 1] > 1 && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => goToPage(page)}
                          className={`min-w-[40px] h-10 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? "bg-blue-500 text-white shadow-lg"
                              : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                </div>

                {/* Botón Siguiente */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300 font-medium"
                >
                  Siguiente
                </button>

                {/* Botón Última Página */}
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Última página"
                >
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Formulario */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingId ? "Editar Doctor" : "Nuevo Doctor"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Información Personal */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Apellido Paterno <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="apellido_paterno"
                        value={formData.apellido_paterno}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Apellido Materno <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="apellido_materno"
                        value={formData.apellido_materno}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Datos de Identificación */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Datos de Identificación
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        RUT <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="rut"
                        value={formData.rut}
                        onChange={handleInputChange}
                        placeholder="20.952.457-0"
                        required
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Información de Contacto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Celular <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="celular"
                        value={formData.celular}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Celular Secundario{" "}
                        <span className="text-gray-400">(Opcional)</span>
                      </label>
                      <input
                        type="tel"
                        name="cel_secundario"
                        value={formData.cel_secundario}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Dirección <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Información Profesional */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Información Profesional
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Especialidades <span className="text-red-500">*</span>
                      </label>

                      {/* Tags de especialidades seleccionadas */}
                      {formData.especialidades_ids.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                          {formData.especialidades_ids.map((espId) => {
                            const esp = especialidades.find(
                              (e) => e.id === espId
                            );
                            return esp ? (
                              <span
                                key={espId}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium"
                              >
                                {esp.nombre}
                                <button
                                  type="button"
                                  onClick={() => eliminarEspecialidad(espId)}
                                  className="ml-1 hover:bg-blue-600 rounded-full p-0.5 transition-colors"
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
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}

                      {/* Selector para agregar especialidades */}
                      <div className="flex gap-2">
                        <select
                          value={especialidadSeleccionada}
                          onChange={(e) =>
                            setEspecialidadSeleccionada(e.target.value)
                          }
                          className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        >
                          <option value="">
                            Seleccione una especialidad...
                          </option>
                          {especialidades
                            .filter(
                              (esp) =>
                                !formData.especialidades_ids.includes(esp.id)
                            )
                            .map((esp) => (
                              <option key={esp.id} value={esp.id}>
                                {esp.nombre}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          onClick={agregarEspecialidad}
                          disabled={!especialidadSeleccionada}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </button>
                      </div>

                      {formData.especialidades_ids.length === 0 && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                          ⚠️ Debe agregar al menos una especialidad
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading || formData.especialidades_ids.length === 0
                    }
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? "Guardando..."
                      : editingId
                      ? "Actualizar"
                      : "Guardar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Clave Temporal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Clave Temporal Generada
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Se ha generado una clave temporal para el doctor. Por favor,
                  compártala de forma segura:
                </p>

                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <p className="text-center text-2xl font-mono font-bold text-gray-900 dark:text-white break-all">
                    {tempPassword}
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <svg
                      className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      Esta clave es temporal y debe ser cambiada por el doctor
                      en su primer inicio de sesión.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
                <button
                  onClick={copiarClave}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold"
                >
                  Copiar Clave
                </button>
                <button
                  onClick={cerrarPasswordModal}
                  className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
