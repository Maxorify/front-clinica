import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export default function MiPerfil() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [profileOriginal, setProfileOriginal] = useState(null);

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
  const [notificacion, setNotificacion] = useState(null);

  useEffect(() => {
    cargarPerfil();
    cargarEstadisticas();
  }, []);

  useEffect(() => {
    if (!notificacion) return;
    const timer = setTimeout(() => setNotificacion(null), 4000);
    return () => clearTimeout(timer);
  }, [notificacion]);

  const showNotification = (type, message) => {
    setNotificacion({ id: Date.now(), type, message });
  };

  const cargarPerfil = async () => {
    try {
      const doctorId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");

      const response = await axios.get(
        `http://localhost:5000/Perfil/doctor/${doctorId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfileData(response.data.perfil);
      setProfileOriginal(response.data.perfil);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      showNotification("error", "Error al cargar el perfil");
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
    setSaving(true);
    try {
      const doctorId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");

      await axios.put(
        `http://localhost:5000/Perfil/doctor/${doctorId}/actualizar`,
        profileData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfileOriginal(profileData);
      setIsEditing(false);
      showNotification("success", "Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      showNotification("error", error.response?.data?.detail || "Error al actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.password_nueva !== passwordForm.confirmPassword) {
      showNotification("error", "Las contraseñas no coinciden");
      return;
    }

    if (passwordForm.password_nueva.length < 6) {
      showNotification("error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const doctorId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");

      await axios.put(
        `http://localhost:5000/Perfil/doctor/${doctorId}/cambiar-password`,
        {
          password_actual: passwordForm.password_actual,
          password_nueva: passwordForm.password_nueva,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowPasswordModal(false);
      setPasswordForm({ password_actual: "", password_nueva: "", confirmPassword: "" });
      showNotification("success", "Contraseña actualizada correctamente");
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      showNotification("error", error.response?.data?.detail || "Error al cambiar la contraseña");
    }
  };

  const handleCancel = () => {
    setProfileData(profileOriginal);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* Notificaciones */}
      <AnimatePresence>
        {notificacion && (
          <motion.div
            key={notificacion.id}
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 right-6 z-50"
          >
            <div
              className={`max-w-sm rounded-xl border shadow-2xl px-4 py-3 backdrop-blur bg-white/90 dark:bg-gray-900/90 ${
                notificacion.type === 'success' ? 'border-emerald-500' : 'border-red-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full ${
                    notificacion.type === 'success'
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100'
                      : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100'
                  }`}
                >
                  {notificacion.type === 'success' ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
                    </svg>
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {notificacion.type === 'success' ? 'Acción completada' : 'Ocurrió un problema'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{notificacion.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificacion(null)}
                  className="ml-3 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-gray-50 dark:from-gray-900 dark:via-emerald-950/20 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                  Mi Perfil Profesional
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">
                  Gestiona tu información y configuración
                </p>
              </div>
              {!isEditing && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-bold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Perfil
                </motion.button>
              )}
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="relative bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg p-6 text-white overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold opacity-90">Pacientes Atendidos</h3>
                    <p className="text-4xl font-bold mt-2">{estadisticas.pacientes_atendidos}</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold opacity-90">Citas Este Mes</h3>
                    <p className="text-4xl font-bold mt-2">{estadisticas.citas_mes_actual}</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold opacity-90">Total Completadas</h3>
                    <p className="text-4xl font-bold mt-2">{estadisticas.total_citas_completadas}</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 lg:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Información del Perfil</h2>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-semibold">
                    {profileData.especialidades.length > 0
                      ? profileData.especialidades[0].nombre
                      : "Sin especialidad"}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={profileData.nombre}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Apellido Paterno */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Apellido Paterno <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="apellido_paterno"
                      value={profileData.apellido_paterno}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Apellido Materno */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Apellido Materno <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="apellido_materno"
                      value={profileData.apellido_materno}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* RUT */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      RUT <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="rut"
                      value={profileData.rut}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Celular */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Celular <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="celular"
                      value={profileData.celular}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Celular Secundario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Celular Secundario (Opcional)
                    </label>
                    <input
                      type="tel"
                      name="cel_secundario"
                      value={profileData.cel_secundario || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Dirección */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dirección <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="direccion"
                      value={profileData.direccion}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                  >
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancel}
                      className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors shadow-lg font-bold"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: saving ? 1 : 1.02 }}
                      whileTap={{ scale: saving ? 1 : 0.98 }}
                      disabled={saving}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving && (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      )}
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </motion.button>
                  </motion.div>
                )}
              </form>
            </motion.div>

            {/* Security Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 lg:p-8"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Seguridad</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Mantén tu cuenta segura actualizando tu contraseña regularmente
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPasswordModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-bold flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Cambiar Contraseña
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modal Cambiar Contraseña */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 to-rose-50 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Cambiar Contraseña
                  </h3>
                  <motion.button
                    onClick={() => setShowPasswordModal(false)}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    name="password_actual"
                    value={passwordForm.password_actual}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    name="password_nueva"
                    value={passwordForm.password_nueva}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white transition-all"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-5 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-bold"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-bold"
                  >
                    Cambiar
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
