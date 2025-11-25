import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Componente para proteger rutas que requieren autenticación
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente hijo a renderizar si está autenticado
 * @param {string[]} props.allowedRoles - Array de roles permitidos para acceder a esta ruta
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('auth_token');
  const location = useLocation();
  const navigate = useNavigate();

  // Efecto para verificar contraseña temporal en cada cambio de ruta
  useEffect(() => {
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Si tiene contraseña temporal y NO está en la página de cambiar contraseña
        if (user.contrasena_temporal && location.pathname !== '/cambiar-contrasena') {
          console.log('useEffect: Usuario con contraseña temporal detectado, redirigiendo...');
          navigate('/cambiar-contrasena', { replace: true });
        }
      } catch (error) {
        console.error('Error en useEffect de ProtectedRoute:', error);
      }
    }
  }, [location.pathname, userStr, navigate]);

  // Si no hay usuario o token, redirigir al login
  if (!userStr || !token) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(userStr);

    // Verificar si el usuario tiene un rol asignado
    if (!user.rol_nombre) {
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      return <Navigate to="/" replace />;
    }

    // IMPORTANTE: Si el usuario tiene contraseña temporal y NO está en la página de cambiar contraseña,
    // redirigirlo a cambiar contraseña
    // Usar truthy check en lugar de === true para mayor robustez
    if (user.contrasena_temporal && location.pathname !== '/cambiar-contrasena') {
      return <Navigate to="/cambiar-contrasena" replace />;
    }

    // Verificar si el rol del usuario está en los roles permitidos
    if (allowedRoles && !allowedRoles.includes(user.rol_nombre)) {
      // Si el usuario no tiene permiso, redirigir a su dashboard correspondiente
      switch (user.rol_nombre) {
        case 'medico':
          return <Navigate to="/doctor/dashboard" replace />;
        case 'admin':
          return <Navigate to="/admin/dashboard" replace />;
        case 'secretaria':
          return <Navigate to="/secretaria/dashboard" replace />;
        default:
          return <Navigate to="/" replace />;
      }
    }

    // Si todo está bien, renderizar el componente hijo
    return children;

  } catch (error) {
    // Si hay error al parsear el usuario, limpiar y redirigir
    console.error('Error al validar usuario:', error);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;
