import { useEffect, useRef } from 'react';
import { getCurrentUser } from '../utils/auth';

const API_URL = 'http://localhost:5000';
const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutos

/**
 * Hook para mantener actualizada la última actividad del usuario
 * mientras tiene la aplicación abierta.
 *
 * Solo funciona para médicos y secretarias con turno activo.
 * Envía un "heartbeat" cada 5 minutos al backend.
 */
export const useActivityHeartbeat = () => {
  const intervalRef = useRef(null);

  useEffect(() => {
    const user = getCurrentUser();

    // Solo activar para médicos y secretarias
    if (!user) return;

    const rolNombre = user.rol_nombre?.toLowerCase();
    if (rolNombre !== 'medico' && rolNombre !== 'secretaria') {
      return;
    }

    // Función para enviar heartbeat
    const sendHeartbeat = async () => {
      try {
        await fetch(`${API_URL}/Asistencia/heartbeat?usuario_sistema_id=${user.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Error al enviar heartbeat:', error);
      }
    };

    // Enviar heartbeat inmediatamente
    sendHeartbeat();

    // Configurar intervalo para heartbeat periódico
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Cleanup: limpiar intervalo al desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return null;
};
