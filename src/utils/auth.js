/**
 * Utilidades de autenticación
 */

/**
 * Cierra la sesión del usuario
 * - Limpia localStorage
 * - Redirige al login
 */
export const logout = () => {
  // Limpiar datos de sesión
  localStorage.removeItem('user');
  localStorage.removeItem('auth_token');

  // Opcional: llamar al backend para invalidar el token
  // fetch('http://localhost:5000/auth/logout', { method: 'POST' });

  // Redirigir al login
  window.location.href = '/';
};

/**
 * Obtiene el usuario actual desde localStorage
 * @returns {Object|null} Usuario o null si no está autenticado
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error al parsear usuario:', error);
    return null;
  }
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const user = getCurrentUser();
  const token = localStorage.getItem('auth_token');
  return user !== null && token !== null;
};

/**
 * Obtiene el token de autenticación
 * @returns {string|null}
 */
export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};
