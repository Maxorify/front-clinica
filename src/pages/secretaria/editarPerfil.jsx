import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_URL = "http://localhost:5000";

export default function EditarPerfil() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notification, setNotification] = useState(null);

  const [profileData, setProfileData] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    rut: "",
    email: "",
    celular: "",
    cel_secundario: "",
    direccion: "",
    rol_nombre: ""
  });

  const [originalProfileData, setOriginalProfileData] = useState(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    cargarDatosUsuario();
  }, []);

  // Auto-ocultar notificaciones después de 4 segundos
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const showNotification = (type, message) => {
    setNotification({ id: Date.now(), type, message });
  };

  const cargarDatosUsuario = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("user_id");
      const token = localStorage.getItem("auth_token");

      if (!userId || !token) {
        showNotification("error", "No se encontró sesión activa");
        return;
      }

      const response = await axios.get(
        `${API_URL}/Perfil/obtener/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const userData = response.data.perfil;
      const formattedData = {
        nombre: userData.nombre || "",
        apellido_paterno: userData.apellido_paterno || "",
        apellido_materno: userData.apellido_materno || "",
        rut: userData.rut || "",
        email: userData.email || "",
        celular: userData.celular || "",
        cel_secundario: userData.cel_secundario || "",
        direccion: userData.direccion || "",
        rol_nombre: userData.rol_nombre || "Secretaria"
      };

      setProfileData(formattedData);
      setOriginalProfileData(formattedData);
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error);
      showNotification("error", error.response?.data?.detail || "Error al cargar los datos del perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const userId = localStorage.getItem("user_id");
      const token = localStorage.getItem("auth_token");

      // Preparar datos para enviar (sin incluir rol_nombre)
      const dataToUpdate = {
        nombre: profileData.nombre,
        apellido_paterno: profileData.apellido_paterno,
        apellido_materno: profileData.apellido_materno,
        rut: profileData.rut,
        email: profileData.email,
        celular: profileData.celular,
        cel_secundario: profileData.cel_secundario,
        direccion: profileData.direccion
      };

      await axios.put(
        `${API_URL}/Perfil/actualizar/${userId}`,
        dataToUpdate,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      showNotification("success", "Perfil actualizado correctamente");
      setOriginalProfileData(profileData);
      setIsEditing(false);

      // Recargar datos para asegurar sincronización
      await cargarDatosUsuario();
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      showNotification("error", error.response?.data?.detail || "Error al actualizar el perfil");
    } finally {
      setGuardando(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification("error", "Las contraseñas no coinciden");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showNotification("error", "La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setGuardando(true);

    try {
      const userId = localStorage.getItem("user_id");
      const token = localStorage.getItem("auth_token");

      await axios.put(
        `${API_URL}/Usuarios/cambiar-password/${userId}`,
        {
          password_actual: passwordForm.currentPassword,
          password_nueva: passwordForm.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      showNotification("success", "Contraseña cambiada correctamente");
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      showNotification("error", error.response?.data?.detail || "Error al cambiar la contraseña");
    } finally {
      setGuardando(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Restaurar datos originales
    if (originalProfileData) {
      setProfileData(originalProfileData);
    }
  };

  const getNombreCompleto = () => {
    return `${profileData.nombre} ${profileData.apellido_paterno} ${profileData.apellido_materno}`.trim();
  };

  const getIniciales = () => {
    const nombre = profileData.nombre || "";
    const apellido = profileData.apellido_paterno || "";
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Cargando perfil...</p>
      </div>
    );
  }

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
                    {notification.type === "success" ? "Acción completada" : "Ocurrió un problema"}
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
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/30 to-gray-50 dark:from-gray-900 dark:via-amber-950/20 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Mi Perfil
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Gestiona tu información personal y preferencias
                </p>
              </div>
              {!isEditing && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-bold flex items-center gap-2 self-start sm:self-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Perfil
                </motion.button>
              )}
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Header Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:p-8"
              >
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-lg ring-4 ring-amber-100 dark:ring-amber-900/50">
                    {getIniciales()}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{getNombreCompleto()}</h2>
                  <p className="text-amber-600 dark:text-amber-400 text-lg mt-1 font-medium">{profileData.rol_nombre}</p>
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">{profileData.email}</span>
                    </div>
                    {profileData.celular && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-sm">{profileData.celular}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </motion.div>

              {/* Personal Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:p-8"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Información Personal
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      required
                      className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white transition-all ${
                        isEditing
                          ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                          : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                      }`}
                      placeholder="Ingrese su nombre"
                    />
              </div>

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
                      className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white transition-all ${
                        isEditing
                          ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                          : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                      }`}
                      placeholder="Ingrese apellido paterno"
                    />
                  </div>

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
                      className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white transition-all ${
                        isEditing
                          ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                          : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                      }`}
                      placeholder="Ingrese apellido materno"
                    />
                  </div>

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
                      className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white transition-all ${
                        isEditing
                          ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                          : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                      }`}
                      placeholder="Ej: 12.345.678-9"
                    />
                  </div>

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
                      required
                      className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white transition-all ${
                        isEditing
                          ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                          : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                      }`}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="celular"
                      value={profileData.celular}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white transition-all ${
                        isEditing
                          ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                          : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                      }`}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono Secundario (Opcional)
                    </label>
                    <input
                      type="tel"
                      name="cel_secundario"
                      value={profileData.cel_secundario}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white transition-all ${
                        isEditing
                          ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                          : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                      }`}
                      placeholder="+56 9 8765 4321"
                    />
                  </div>

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
                      className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white transition-all resize-none ${
                        isEditing
                          ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                          : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                      }`}
                      placeholder="Ingrese su dirección completa"
                    />
                  </div>
            </div>
          </motion.div>

          {/* Security Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:p-8"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Seguridad
            </h2>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Contraseña</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Protege tu cuenta con una contraseña segura</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl transition-all font-bold shadow-lg hover:shadow-xl self-start sm:self-center"
                >
                  Cambiar Contraseña
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={guardando}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardando ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar Cambios
                  </>
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleCancel}
                disabled={guardando}
                className="px-6 py-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-xl transition-colors font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </motion.button>
            </motion.div>
          )}
        </form>

        {/* Password Change Modal */}
        <AnimatePresence>
          {showPasswordModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
              >
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Cambiar Contraseña</h2>
                        <p className="text-amber-100 text-sm">Actualiza tu contraseña de acceso</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordForm({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: ""
                        });
                        setShowPasswords({
                          currentPassword: false,
                          newPassword: false,
                          confirmPassword: false
                        });
                      }}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
                  {/* Contraseña Actual */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Contraseña Actual *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.currentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-white transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, currentPassword: !prev.currentPassword }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showPasswords.currentPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Nueva Contraseña */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Nueva Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.newPassword ? "text" : "password"}
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength="8"
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-white transition-all"
                        placeholder="Mínimo 8 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, newPassword: !prev.newPassword }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showPasswords.newPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordForm.newPassword && passwordForm.newPassword.length < 8 && (
                      <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        La contraseña debe tener al menos 8 caracteres
                      </p>
                    )}
                    {passwordForm.newPassword && passwordForm.newPassword.length >= 8 && (
                      <p className="mt-2 text-xs text-green-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Contraseña válida
                      </p>
                    )}
                  </div>

                  {/* Confirmar Nueva Contraseña */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Confirmar Nueva Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-white transition-all"
                        placeholder="Confirme la nueva contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showPasswords.confirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                      <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Las contraseñas no coinciden
                      </p>
                    )}
                    {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
                      <p className="mt-2 text-xs text-green-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Las contraseñas coinciden
                      </p>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={guardando}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl transition-all font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {guardando ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          Cambiando...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Cambiar Contraseña
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordForm({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: ""
                        });
                        setShowPasswords({
                          currentPassword: false,
                          newPassword: false,
                          confirmPassword: false
                        });
                      }}
                      disabled={guardando}
                      className="px-6 py-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-xl transition-colors font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
