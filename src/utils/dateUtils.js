/**
 * Utilidades para manejo de fechas con zona horaria de Chile (UTC-3)
 */

/**
 * Crea una fecha en zona horaria de Chile y la convierte a UTC para enviar al backend
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD
 * @param {number} hours - Hora (0-23)
 * @param {number} minutes - Minutos (0-59)
 * @returns {Date} Fecha en UTC que representa la hora local de Chile
 */
export const createChileDateUTC = (dateStr, hours = 0, minutes = 0, seconds = 0, milliseconds = 0) => {
  // Parsear la fecha sin zona horaria
  const [year, month, day] = dateStr.split('-').map(Number);

  // Crear fecha en UTC
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, milliseconds));

  // Ajustar por la diferencia de zona horaria de Chile (UTC-3)
  // Si en Chile son las 00:00 (UTC-3), en UTC son las 03:00
  date.setUTCHours(date.getUTCHours() + 3);

  return date;
};

/**
 * Obtiene el inicio del día en zona horaria de Chile (00:00:00) convertido a UTC
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD
 * @returns {Date} Fecha con hora 00:00:00 Chile en UTC
 */
export const getChileDayStart = (dateStr) => {
  return createChileDateUTC(dateStr, 0, 0, 0, 0);
};

/**
 * Obtiene el fin del día en zona horaria de Chile (23:59:59) convertido a UTC
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD
 * @returns {Date} Fecha con hora 23:59:59 Chile en UTC
 */
export const getChileDayEnd = (dateStr) => {
  return createChileDateUTC(dateStr, 23, 59, 59, 999);
};

/**
 * Convierte una fecha/hora local de Chile a UTC para enviar al backend
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD
 * @param {string} timeStr - Hora en formato HH:MM
 * @returns {string} ISO string en UTC
 */
export const chileTimeToUTC = (dateStr, timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = createChileDateUTC(dateStr, hours, minutes, 0, 0);
  return date.toISOString();
};

/**
 * Convierte una fecha UTC del backend a hora local de Chile para mostrar
 * @param {string} utcDateStr - Fecha en formato ISO UTC
 * @returns {Date} Fecha ajustada a zona horaria de Chile
 */
export const utcToChileTime = (utcDateStr) => {
  const date = new Date(utcDateStr);
  // La fecha ya viene en UTC, la ajustamos mentalmente a Chile (UTC-3)
  return date;
};

/**
 * Convierte una fecha UTC del backend a fecha local de Chile (solo fecha, sin hora)
 * @param {string} utcDateStr - Fecha en formato ISO UTC
 * @returns {string} Fecha en formato YYYY-MM-DD en zona horaria Chile
 */
export const utcToChileDate = (utcDateStr) => {
  const date = new Date(utcDateStr);
  
  // Convertir a string con zona horaria Chile usando toLocaleString
  // Esto maneja correctamente DST y conversiones de zona horaria
  const chileStr = date.toLocaleString('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return chileStr; // Ya está en formato YYYY-MM-DD
};

/**
 * Formatea una fecha UTC a string legible en hora de Chile
 * @param {string} utcDateStr - Fecha en formato ISO UTC
 * @returns {string} Fecha formateada en zona horaria de Chile
 */
export const formatChileDateTime = (utcDateStr) => {
  const date = new Date(utcDateStr);
  // Ajustar a UTC-3 (Chile) manualmente
  const chileDate = new Date(date.getTime() - 3 * 60 * 60 * 1000);

  return chileDate.toLocaleString('es-CL', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ====================================================================
// FUNCIONES PARA MOSTRAR FECHAS UTC DEL BACKEND EN ZONA HORARIA LOCAL
// Usa conversión automática del navegador (America/Santiago)
// ====================================================================

/**
 * Formatea hora UTC a hora local de Chile (HH:MM formato 24h)
 * Conversión automática usando zona horaria del navegador
 * @param {string} dateString - Fecha ISO UTC del backend
 * @returns {string} Hora formateada "HH:MM" en zona Chile
 */
export const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Formatea fecha UTC a fecha local de Chile (DD/MM/YYYY)
 * Conversión automática usando zona horaria del navegador
 * @param {string} dateString - Fecha ISO UTC del backend
 * @returns {string} Fecha formateada en zona Chile
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('es-CL', {
    timeZone: 'America/Santiago'
  });
};

/**
 * Formatea fecha y hora UTC a local de Chile (DD/MM/YYYY HH:MM:SS)
 * Conversión automática usando zona horaria del navegador
 * @param {string} dateString - Fecha ISO UTC del backend
 * @returns {string} Fecha y hora formateada en zona Chile
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    hour12: false
  });
};

/**
 * Parsea fecha UTC del backend a objeto Date en zona horaria local
 * Usado para cálculos de diferencias de tiempo
 * @param {string} dateString - Fecha ISO UTC del backend
 * @returns {Date} Objeto Date en zona local
 */
export const parseUTCDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString);
};
