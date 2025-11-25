import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export default function MiPerfil() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    id: "",
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    nombre_completo: "",
    rut: "",
    email: "",
    celular: "",
    cel_secundario: "",
    direccion: "",
    rol_nombre: "",
    especialidades: [],
  });

  const [estadisticas, setEstadisticas] = useState({
    pacientes_atendidos: 0,
    citas_mes_actual: 0,
    total_citas_completadas: 0,
  });

  const [passwordForm, setPasswordForm] = useState({
    password_actual: "",
    password_nueva: "",
    confirmPassword: "",
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notificacion, setNotificacion] = useState({
    show: false,
    mensaje: "",
    tipo: "",
  });

  useEffect(() => {
    cargarPerfil();
    cargarEstadisticas();
  }, []);

  const cargarPerfil = async () => {
    try {
      const doctorId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");

      const response = await axios.get(
        `http://localhost:5000/Perfil/doctor/${doctorId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfileData(response.data.perfil);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      mostrarNotificacion("Error al cargar el perfil", "error");
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const doctorId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");

      const response = await axios.get(
        `http://localhost:5000/Perfil/doctor/${doctorId}/estadisticas`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEstadisticas(response.data.estadisticas);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const doctorId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");

      await axios.put(
        `http://localhost:5000/Perfil/doctor/${doctorId}`,
        {
          nombre: profileData.nombre,
          apellido_paterno: profileData.apellido_paterno,
          apellido_materno: profileData.apellido_materno,
          email: profileData.email,
          celular: profileData.celular,
          cel_secundario: profileData.cel_secundario,
          direccion: profileData.direccion,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      mostrarNotificacion("Perfil actualizado exitosamente", "success");
      setIsEditing(false);
      cargarPerfil();
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      mostrarNotificacion(
        error.response?.data?.detail || "Error al actualizar el perfil",
        "error"
      );
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.password_nueva !== passwordForm.confirmPassword) {
      mostrarNotificacion("Las contraseñas no coinciden", "error");
      return;
    }

    if (passwordForm.password_nueva.length < 6) {
      mostrarNotificacion(
        "La contraseña debe tener al menos 6 caracteres",
        "error"
      );
      return;
    }

    try {
      const doctorId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");

      await axios.post(
        `http://localhost:5000/Perfil/doctor/${doctorId}/cambiar-password`,
        {
          password_actual: passwordForm.password_actual,
          password_nueva: passwordForm.password_nueva,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      mostrarNotificacion("Contraseña cambiada exitosamente", "success");
      setShowPasswordModal(false);
      setPasswordForm({
        password_actual: "",
        password_nueva: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      mostrarNotificacion(
        error.response?.data?.detail || "Error al cambiar la contraseña",
        "error"
      );
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    cargarPerfil();
  };

  const mostrarNotificacion = (mensaje, tipo) => {
    setNotificacion({ show: true, mensaje, tipo });
    setTimeout(() => {
      setNotificacion({ show: false, mensaje: "", tipo: "" });
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Notificación */}
      <AnimatePresence>
        {notificacion.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-lg ${
              notificacion.tipo === "success"
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                : "bg-gradient-to-r from-red-500 to-rose-600 text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              {notificacion.tipo === "success" ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              <p className="font-semibold text-lg">{notificacion.mensaje}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Mi Perfil Profesional
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Gestiona tu información y configuración
          </p>
        </div>
        {!isEditing && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(true)}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl transition-all duration-300 font-semibold flex items-center gap-3 shadow-lg shadow-green-500/30"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Editar Perfil
          </motion.button>
        )}
      </motion.div>

      <form id="profile-form" onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Header Card - Hero Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-3xl shadow-2xl p-10"
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full translate-y-48 -translate-x-48 blur-3xl pointer-events-none"></div>

          <div className="relative flex items-center gap-8">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center text-green-600 text-5xl font-bold shadow-2xl ring-4 ring-white/30"
            >
              {profileData.nombre.charAt(0)}
              {profileData.apellido_paterno.charAt(0)}
            </motion.div>
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-white drop-shadow-lg">
                {profileData.nombre_completo}
              </h2>
              <p className="text-green-50 text-xl mt-2 font-medium">
                {profileData.especialidades.length > 0
                  ? profileData.especialidades.map((e) => e.nombre).join(" • ")
                  : "Sin especialidad asignada"}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold">
                  RUT: {profileData.rut || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-white/90">
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
                  <span className="font-medium">{profileData.email}</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
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
                  <span className="font-medium">{profileData.celular}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pacientes Atendidos
                </p>
                <p className="text-5xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent mt-3">
                  {estadisticas.pacientes_atendidos}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Consultas completadas
                </p>
              </div>
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-10 h-10 text-white"
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
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-violet-500/20 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Citas Este Mes
                </p>
                <p className="text-5xl font-bold bg-gradient-to-br from-purple-600 to-violet-600 bg-clip-text text-transparent mt-3">
                  {estadisticas.citas_mes_actual}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  En progreso y pendientes
                </p>
              </div>
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Completadas
                </p>
                <p className="text-5xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent mt-3">
                  {estadisticas.total_citas_completadas}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Historial completo
                </p>
              </div>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-shadow duration-300"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
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
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Información Personal
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={profileData.nombre}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-5 py-3.5 border-2 rounded-xl text-gray-900 dark:text-white transition-all duration-200 ${
                  isEditing
                    ? "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-green-500/20 focus:border-green-500"
                    : "bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Apellido Paterno
              </label>
              <input
                type="text"
                name="apellido_paterno"
                value={profileData.apellido_paterno}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-5 py-3.5 border-2 rounded-xl text-gray-900 dark:text-white transition-all duration-200 ${
                  isEditing
                    ? "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-green-500/20 focus:border-green-500"
                    : "bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Apellido Materno
              </label>
              <input
                type="text"
                name="apellido_materno"
                value={profileData.apellido_materno || ""}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-5 py-3.5 border-2 rounded-xl text-gray-900 dark:text-white transition-all duration-200 ${
                  isEditing
                    ? "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-green-500/20 focus:border-green-500"
                    : "bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                RUT{" "}
                <span className="text-xs text-gray-500 font-normal">
                  (No editable)
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileData.rut || "N/A"}
                  disabled={true}
                  className="w-full px-5 py-3.5 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700/50 dark:to-gray-700/30 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white cursor-not-allowed"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-5 py-3.5 border-2 rounded-xl text-gray-900 dark:text-white transition-all duration-200 ${
                  isEditing
                    ? "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-green-500/20 focus:border-green-500"
                    : "bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Teléfono Principal
              </label>
              <input
                type="tel"
                name="celular"
                value={profileData.celular}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-5 py-3.5 border-2 rounded-xl text-gray-900 dark:text-white transition-all duration-200 ${
                  isEditing
                    ? "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-green-500/20 focus:border-green-500"
                    : "bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Teléfono Secundario{" "}
                <span className="text-xs text-gray-500 font-normal">
                  (Opcional)
                </span>
              </label>
              <input
                type="tel"
                name="cel_secundario"
                value={profileData.cel_secundario || ""}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-5 py-3.5 border-2 rounded-xl text-gray-900 dark:text-white transition-all duration-200 ${
                  isEditing
                    ? "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-green-500/20 focus:border-green-500"
                    : "bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Dirección
              </label>
              <input
                type="text"
                name="direccion"
                value={profileData.direccion}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-5 py-3.5 border-2 rounded-xl text-gray-900 dark:text-white transition-all duration-200 ${
                  isEditing
                    ? "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-green-500/20 focus:border-green-500"
                    : "bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                }`}
              />
            </div>
          </div>
        </motion.div>

        {/* Professional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-300"
        >
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg
                  className="w-6 h-6 text-white"
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
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Información Profesional
              </h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Especialidades{" "}
                  <span className="text-xs text-gray-500 font-normal">
                    (Solo el administrador puede modificarlas)
                  </span>
                </label>
                <div className="relative">
                  <div className="min-h-[80px] px-5 py-4 bg-gradient-to-br from-purple-50/50 to-violet-50/50 dark:from-purple-900/20 dark:to-violet-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl">
                    <div className="flex flex-wrap gap-2">
                      {profileData.especialidades.length > 0 ? (
                        profileData.especialidades.map((especialidad) => (
                          <span
                            key={especialidad.id}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-purple-500/30 hover:scale-105 transition-transform duration-200"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {especialidad.nombre}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 italic">
                          Sin especialidades asignadas
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Rol{" "}
                  <span className="text-xs text-gray-500 font-normal">
                    (No editable)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profileData.rol_nombre || "N/A"}
                    disabled={true}
                    className="w-full px-5 py-3.5 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700/50 dark:to-gray-700/30 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white cursor-not-allowed"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-300"
        >
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Seguridad
              </h2>
            </div>

            <div className="relative bg-gradient-to-br from-red-50/50 to-rose-50/50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Contraseña
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mantén tu cuenta segura actualizando tu contraseña
                      regularmente
                    </p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-200 font-semibold text-sm"
                >
                  Cambiar Contraseña
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons - Al final del formulario */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="flex gap-4 justify-end sticky bottom-6 z-30"
          >
            <motion.button
              type="button"
              onClick={handleCancel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 font-bold text-base"
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-xl shadow-green-500/50 hover:shadow-2xl hover:shadow-green-500/60 transition-all duration-200 font-bold text-base flex items-center gap-2"
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Guardar Cambios
            </motion.button>
          </motion.div>
        )}
      </form>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full"
            >
              {/* Decorative blur circles */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-400/20 blur-3xl -translate-y-24 translate-x-24"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-400/20 blur-3xl translate-y-24 -translate-x-24"></div>

              <div className="relative p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Cambiar Contraseña
                    </h3>
                  </div>
                  <motion.button
                    onClick={() => setShowPasswordModal(false)}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
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
                  </motion.button>
                </div>

                {/* Form */}
                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      name="password_actual"
                      value={passwordForm.password_actual}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 text-gray-900 dark:text-white transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      name="password_nueva"
                      value={passwordForm.password_nueva}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 text-gray-900 dark:text-white transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 text-gray-900 dark:text-white transition-all duration-200"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6">
                    <motion.button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-6 py-3.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-bold"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-200 font-bold"
                    >
                      Cambiar
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
