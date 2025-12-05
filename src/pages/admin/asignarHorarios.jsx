import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChileDayStart, getChileDayEnd, utcToChileDate } from "../../utils/dateUtils";

const API_URL = "http://localhost:5000";

export default function AsignarHorarios() {
  const queryClient = useQueryClient();
  
  // Declarar TODOS los estados primero antes de React Query
  const [doctorSeleccionado, setDoctorSeleccionado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [vistaCreacion, setVistaCreacion] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [horarioEditar, setHorarioEditar] = useState(null);
  const [notification, setNotification] = useState(null);
  const [vistaCalendario, setVistaCalendario] = useState("semana");
  const [fechaActual, setFechaActual] = useState(new Date());
  const [busquedaDoctor, setBusquedaDoctor] = useState("");
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [horarioAEliminar, setHorarioAEliminar] = useState(null);
  const [mesVistaPrevia, setMesVistaPrevia] = useState(new Date());
  const [loading, setLoading] = useState(false); // Estado faltante
  const [formData, setFormData] = useState({
    fecha_inicio: new Date().toISOString().split("T")[0],
    fecha_fin: "",
    dias_configurados: {
      0: {
        activo: false,
        hora_inicio: "08:00",
        hora_fin: "18:00",
        duracion_bloque_minutos: 30,
      },
      1: {
        activo: false,
        hora_inicio: "08:00",
        hora_fin: "18:00",
        duracion_bloque_minutos: 30,
      },
      2: {
        activo: false,
        hora_inicio: "08:00",
        hora_fin: "18:00",
        duracion_bloque_minutos: 30,
      },
      3: {
        activo: false,
        hora_inicio: "08:00",
        hora_fin: "18:00",
        duracion_bloque_minutos: 30,
      },
      4: {
        activo: false,
        hora_inicio: "08:00",
        hora_fin: "18:00",
        duracion_bloque_minutos: 30,
      },
      5: {
        activo: false,
        hora_inicio: "08:00",
        hora_fin: "18:00",
        duracion_bloque_minutos: 30,
      },
      6: {
        activo: false,
        hora_inicio: "08:00",
        hora_fin: "18:00",
        duracion_bloque_minutos: 30,
      },
    },
  });

  // React Query para cargar doctores (usuarios con rol_id=2)
  const { data: doctores = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/Usuarios/listar-usuarios`);
      return response.data?.usuarios || [];
    },
    staleTime: 2 * 60 * 1000,
    select: (data) => data.filter(u => u.rol_id === 2),
    onError: (error) => {
      console.error('Error al cargar doctores:', error);
      showNotification('error', 'Error al cargar doctores');
    }
  });
  
  // React Query para cargar horarios del doctor seleccionado (vista normal)
  const { data: horarios = [], isLoading: loadingHorarios } = useQuery({
    queryKey: ['horarios', doctorSeleccionado?.id, fechaActual.toISOString(), vistaCalendario],
    queryFn: async () => {
      if (!doctorSeleccionado) return [];
      
      // Calcular rango de fechas según la vista
      let inicio, fin;

      if (vistaCalendario === "semana") {
        // Para vista semanal: lunes a domingo de la semana actual
        const fechaBase = new Date(fechaActual);
        const diaSemana = fechaBase.getDay();
        const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
        fechaBase.setDate(fechaBase.getDate() + diasHastaLunes);

        const fechaInicioStr = fechaBase.toISOString().split("T")[0];

        fechaBase.setDate(fechaBase.getDate() + 6); // Domingo
        const fechaFinStr = fechaBase.toISOString().split("T")[0];

        inicio = getChileDayStart(fechaInicioStr);
        fin = getChileDayEnd(fechaFinStr);
      } else {
        // Para vista mensual: todo el mes
        const primerDia = new Date(
          fechaActual.getFullYear(),
          fechaActual.getMonth(),
          1
        );
        const ultimoDia = new Date(
          fechaActual.getFullYear(),
          fechaActual.getMonth() + 1,
          0
        );

        inicio = getChileDayStart(primerDia.toISOString().split("T")[0]);
        fin = getChileDayEnd(ultimoDia.toISOString().split("T")[0]);
      }

      console.log(
        "DEBUG - Cargando horarios para rango:",
        inicio.toISOString(),
        "a",
        fin.toISOString()
      );

      const response = await axios.get(`${API_URL}/Horarios/listar-horarios`, {
        params: {
          usuario_sistema_id: doctorSeleccionado.id,
          fecha_inicio: inicio.toISOString(),
          fecha_fin: fin.toISOString(),
        },
      });

      return response.data.horarios || [];
    },
    staleTime: 2 * 60 * 1000, // 2 min - horarios cambian con frecuencia moderada
    enabled: !!doctorSeleccionado, // Solo ejecutar si hay doctor seleccionado
    onError: (error) => {
      console.error('Error al cargar horarios:', error);
      showNotification('error', 'Error al cargar horarios');
    }
  });

  // React Query para cargar horarios existentes en vista de creación (rango completo)
  const { data: horariosExistentes = [] } = useQuery({
    queryKey: ['horariosExistentes', doctorSeleccionado?.id, formData.fecha_inicio, formData.fecha_fin, mesVistaPrevia.toISOString()],
    queryFn: async () => {
      if (!doctorSeleccionado || !vistaCreacion) return [];
      
      const fechaInicio = new Date(formData.fecha_inicio);
      const fechaFin = formData.fecha_fin
        ? new Date(formData.fecha_fin)
        : new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 3, fechaInicio.getDate());

      // Expandir el rango para incluir todo el mes de vista previa
      const primerDiaMes = new Date(mesVistaPrevia.getFullYear(), mesVistaPrevia.getMonth(), 1);
      const ultimoDiaMes = new Date(mesVistaPrevia.getFullYear(), mesVistaPrevia.getMonth() + 1, 0);
      
      const inicio = primerDiaMes < fechaInicio ? primerDiaMes : fechaInicio;
      const fin = ultimoDiaMes > fechaFin ? ultimoDiaMes : fechaFin;

      const response = await axios.get(`${API_URL}/Horarios/listar-horarios`, {
        params: {
          usuario_sistema_id: doctorSeleccionado.id,
          fecha_inicio: inicio.toISOString(),
          fecha_fin: fin.toISOString(),
        },
      });

      return response.data.horarios || [];
    },
    staleTime: 1 * 60 * 1000, // 1 min - más corto porque estamos creando
    enabled: !!doctorSeleccionado && vistaCreacion,
    onError: (error) => {
      console.error('Error al cargar horarios existentes:', error);
    }
  });

  const diasSemana = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  // Los useEffects obsoletos se eliminaron porque React Query maneja la carga de datos

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Sincronizar mesVistaPrevia con fecha_inicio cuando cambie
  useEffect(() => {
    if (formData.fecha_inicio) {
      setMesVistaPrevia(new Date(formData.fecha_inicio));
    }
  }, [formData.fecha_inicio]);

  const showNotification = (type, message) => {
    setNotification({ id: Date.now(), type, message });
  };

  const crearHorarioSemanal = async () => {
    if (!doctorSeleccionado) {
      showNotification("error", "Debe seleccionar un doctor");
      return;
    }

    // Validar que al menos un día esté activo
    const diasActivos = Object.entries(formData.dias_configurados).filter(
      ([_, config]) => config.activo
    );
    if (diasActivos.length === 0) {
      showNotification(
        "error",
        "Debe seleccionar al menos un día de la semana"
      );
      return;
    }

    setLoading(true);
    try {
      // Crear horarios para cada día configurado
      const promises = diasActivos.map(([diaIndex, config]) => {
        return axios.post(`${API_URL}/Horarios/crear-horario-semanal`, {
          usuario_sistema_id: doctorSeleccionado.id,
          dia_semana: parseInt(diaIndex),
          hora_inicio: config.hora_inicio,
          hora_fin: config.hora_fin,
          duracion_bloque_minutos: config.duracion_bloque_minutos,
          fecha_inicio: formData.fecha_inicio,
          fecha_fin: formData.fecha_fin,
        });
      });

      const resultados = await Promise.all(promises);
      
      // Analizar resultados para informar sobre conflictos
      let totalCreados = 0;
      let totalSaltados = 0;
      
      resultados.forEach(res => {
        if (res.data.bloques_creados) {
          totalCreados += res.data.bloques_creados;
        }
        if (res.data.bloques_saltados) {
          totalSaltados += res.data.bloques_saltados;
        }
      });

      // Mensaje contextual basado en resultados
      if (totalSaltados > 0) {
        showNotification(
          "success",
          `✓ ${totalCreados} bloques creados. ${totalSaltados} bloques omitidos (ya existían o conflicto).`
        );
      } else {
        showNotification(
          "success",
          `✓ ${totalCreados} bloques de horario creados exitosamente`
        );
      }
      
      setShowModal(false);
      setVistaCreacion(false); // Volver a la vista normal
      
      // Invalidar cache para recargar horarios
      queryClient.invalidateQueries(['horarios', doctorSeleccionado?.id]);
      queryClient.invalidateQueries(['horariosExistentes', doctorSeleccionado?.id]);
      
      // Resetear form
      setFormData({
        fecha_inicio: new Date().toISOString().split("T")[0],
        fecha_fin: "",
        dias_configurados: {
          0: {
            activo: false,
            hora_inicio: "08:00",
            hora_fin: "18:00",
            duracion_bloque_minutos: 30,
          },
          1: {
            activo: false,
            hora_inicio: "08:00",
            hora_fin: "18:00",
            duracion_bloque_minutos: 30,
          },
          2: {
            activo: false,
            hora_inicio: "08:00",
            hora_fin: "18:00",
            duracion_bloque_minutos: 30,
          },
          3: {
            activo: false,
            hora_inicio: "08:00",
            hora_fin: "18:00",
            duracion_bloque_minutos: 30,
          },
          4: {
            activo: false,
            hora_inicio: "08:00",
            hora_fin: "18:00",
            duracion_bloque_minutos: 30,
          },
          5: {
            activo: false,
            hora_inicio: "08:00",
            hora_fin: "18:00",
            duracion_bloque_minutos: 30,
          },
          6: {
            activo: false,
            hora_inicio: "08:00",
            hora_fin: "18:00",
            duracion_bloque_minutos: 30,
          },
        },
      });
      
      // Invalidar cache de horarios para refrescar
      queryClient.invalidateQueries(['horarios', doctorSeleccionado?.id]);
    } catch (error) {
      console.error("Error al crear horarios:", error);
      showNotification(
        "error",
        error.response?.data?.detail || "Error al crear horarios"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleDia = (diaIndex) => {
    setFormData({
      ...formData,
      dias_configurados: {
        ...formData.dias_configurados,
        [diaIndex]: {
          ...formData.dias_configurados[diaIndex],
          activo: !formData.dias_configurados[diaIndex].activo,
        },
      },
    });
  };

  const actualizarConfigDia = (diaIndex, campo, valor) => {
    setFormData({
      ...formData,
      dias_configurados: {
        ...formData.dias_configurados,
        [diaIndex]: {
          ...formData.dias_configurados[diaIndex],
          [campo]: valor,
        },
      },
    });
  };

  // Función auxiliar para detectar si dos rangos de tiempo se solapan
  const haySolapamiento = (inicio1, fin1, inicio2, fin2) => {
    return inicio1 < fin2 && fin1 > inicio2;
  };

  // Función para verificar si un día tiene conflictos con horarios existentes
  const verificarConflictos = (fecha, config) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    const conflictos = [];
    
    // Generar bloques del día planificado
    const bloquesPlanificados = [];
    const [horaInicioH, horaInicioM] = config.hora_inicio.split(':');
    const [horaFinH, horaFinM] = config.hora_fin.split(':');
    
    let inicioBloqueLocal = new Date(fecha);
    inicioBloqueLocal.setHours(parseInt(horaInicioH), parseInt(horaInicioM), 0, 0);
    
    const finDiaLocal = new Date(fecha);
    finDiaLocal.setHours(parseInt(horaFinH), parseInt(horaFinM), 0, 0);
    
    while (inicioBloqueLocal < finDiaLocal) {
      const finBloqueLocal = new Date(inicioBloqueLocal.getTime() + config.duracion_bloque_minutos * 60000);
      
      if (finBloqueLocal > finDiaLocal) break;
      
      bloquesPlanificados.push({
        inicio: new Date(inicioBloqueLocal),
        fin: new Date(finBloqueLocal)
      });
      
      inicioBloqueLocal = finBloqueLocal;
    }
    
    // Verificar solapamientos con horarios existentes
    bloquesPlanificados.forEach(bloquePlanificado => {
      horariosExistentes.forEach(existente => {
        const inicioExistente = new Date(existente.inicio_bloque);
        const finExistente = new Date(existente.finalizacion_bloque);
        
        if (haySolapamiento(
          bloquePlanificado.inicio,
          bloquePlanificado.fin,
          inicioExistente,
          finExistente
        )) {
          conflictos.push({
            bloqueNuevo: bloquePlanificado,
            bloqueExistente: existente
          });
        }
      });
    });
    
    return conflictos;
  };

  // Calcular vista previa del calendario para cualquier mes
  const calcularVistaPrevia = () => {
    const diasConHorario = [];
    const fechaInicio = new Date(formData.fecha_inicio);
    const fechaFin = formData.fecha_fin
      ? new Date(formData.fecha_fin)
      : new Date(
          fechaInicio.getFullYear(),
          fechaInicio.getMonth() + 3,
          fechaInicio.getDate()
        );

    // Obtener todos los días del mes que se está visualizando (mesVistaPrevia)
    const primerDiaMes = new Date(
      mesVistaPrevia.getFullYear(),
      mesVistaPrevia.getMonth(),
      1
    );
    const ultimoDiaMes = new Date(
      mesVistaPrevia.getFullYear(),
      mesVistaPrevia.getMonth() + 1,
      0
    );

    let fechaActual = new Date(primerDiaMes);

    while (fechaActual <= ultimoDiaMes) {
      const diaSemana =
        fechaActual.getDay() === 0 ? 6 : fechaActual.getDay() - 1; // Convertir domingo(0) a 6, lunes(1) a 0
      const config = formData.dias_configurados[diaSemana];

      if (
        config &&
        config.activo &&
        fechaActual >= fechaInicio &&
        fechaActual <= fechaFin
      ) {
        const conflictos = verificarConflictos(new Date(fechaActual), config);
        diasConHorario.push({
          fecha: new Date(fechaActual),
          diaSemana: diaSemana,
          config: config,
          conflictos: conflictos,
          tieneConflicto: conflictos.length > 0
        });
      }

      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return diasConHorario;
  };

  const obtenerDiasMesVistaPrevia = () => {
    const año = mesVistaPrevia.getFullYear();
    const mes = mesVistaPrevia.getMonth();

    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const primerDiaSemana = primerDia.getDay();
    const diasAnteriores = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

    const dias = [];

    // Días del mes anterior
    for (let i = diasAnteriores; i > 0; i--) {
      const dia = new Date(año, mes, 1 - i);
      dias.push({ fecha: dia, esMesActual: false });
    }

    // Días del mes actual
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      const dia = new Date(año, mes, i);
      dias.push({ fecha: dia, esMesActual: true });
    }

    // Días del mes siguiente
    const diasRestantes = 7 - (dias.length % 7);
    if (diasRestantes < 7) {
      for (let i = 1; i <= diasRestantes; i++) {
        const dia = new Date(año, mes + 1, i);
        dias.push({ fecha: dia, esMesActual: false });
      }
    }

    return dias;
  };

  const cambiarMesVistaPrevia = (direccion) => {
    setMesVistaPrevia((prev) => {
      const nuevaFecha = new Date(prev);
      nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
      return nuevaFecha;
    });
  };

  const confirmarEliminacion = (horarioId) => {
    setHorarioAEliminar(horarioId);
    setShowConfirmModal(true);
  };

  const eliminarHorario = async () => {
    if (!horarioAEliminar) return;

    try {
      await axios.delete(
        `${API_URL}/Horarios/eliminar-horario/${horarioAEliminar}`
      );
      showNotification("success", "Horario eliminado correctamente");
      setShowConfirmModal(false);
      setHorarioAEliminar(null);

      // Si estamos en el modal de detalle y era el último horario, cerrarlo
      if (showDetalleModal && diaSeleccionado) {
        const horariosDelDia = obtenerHorariosDia(diaSeleccionado);
        if (horariosDelDia.length === 1) {
          setShowDetalleModal(false);
        }
      }

      // Invalidar cache de horarios
      queryClient.invalidateQueries(['horarios', doctorSeleccionado?.id]);
    } catch (error) {
      console.error("Error al eliminar horario:", error);
      showNotification("error", "Error al eliminar horario");
      setShowConfirmModal(false);
      setHorarioAEliminar(null);
    }
  };

  const eliminarTodosHorarios = async () => {
    if (!doctorSeleccionado) return;
    if (
      !confirm(
        "¿Está seguro de eliminar TODOS los horarios futuros de este doctor?"
      )
    )
      return;

    try {
      await axios.delete(
        `${API_URL}/Horarios/eliminar-horarios-doctor/${doctorSeleccionado.id}`
      );
      showNotification("success", "Todos los horarios fueron eliminados");
      
      // Invalidar cache de horarios
      queryClient.invalidateQueries(['horarios', doctorSeleccionado?.id]);
    } catch (error) {
      console.error("Error al eliminar horarios:", error);
      showNotification("error", "Error al eliminar horarios");
    }
  };

  const formatearNombreCompleto = (persona) => {
    if (!persona) return "";
    return `${persona.nombre || ""} ${persona.apellido_paterno || ""} ${
      persona.apellido_materno || ""
    }`.trim();
  };

  const doctoresFiltrados = doctores.filter((doctor) => {
    if (!busquedaDoctor) return true;
    const nombreCompleto = formatearNombreCompleto(doctor).toLowerCase();
    return nombreCompleto.includes(busquedaDoctor.toLowerCase());
  });

  const formatearFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString("es-CL", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const agruparHorariosPorDia = () => {
    const grupos = {};
    horarios.forEach((h) => {
      const fecha = new Date(h.inicio_bloque).toISOString().split("T")[0];
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(h);
    });
    return grupos;
  };

  const cambiarSemana = (direccion) => {
    const nueva = new Date(fechaActual);
    nueva.setDate(nueva.getDate() + direccion * 7);
    setFechaActual(nueva);
  };

  const cambiarMes = (direccion) => {
    const nueva = new Date(fechaActual);
    nueva.setMonth(nueva.getMonth() + direccion);
    setFechaActual(nueva);
  };

  const obtenerDiasSemana = () => {
    const inicio = new Date(fechaActual);
    inicio.setDate(inicio.getDate() - inicio.getDay() + 1); // Lunes

    const dias = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicio);
      dia.setDate(dia.getDate() + i);
      dias.push(dia);
    }
    return dias;
  };

  const obtenerDiasMes = () => {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();

    // Primer día del mes
    const primerDia = new Date(año, mes, 1);
    // Último día del mes
    const ultimoDia = new Date(año, mes + 1, 0);

    // Día de la semana del primer día (0=Dom, 1=Lun, etc.)
    const primerDiaSemana = primerDia.getDay();

    // Días del mes anterior para completar la primera semana
    const diasAnteriores = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

    const dias = [];

    // Agregar días del mes anterior
    for (let i = diasAnteriores; i > 0; i--) {
      const dia = new Date(año, mes, 1 - i);
      dias.push({ fecha: dia, esMesActual: false });
    }

    // Agregar días del mes actual
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      const dia = new Date(año, mes, i);
      dias.push({ fecha: dia, esMesActual: true });
    }

    // Agregar días del mes siguiente para completar la última semana
    const diasRestantes = 7 - (dias.length % 7);
    if (diasRestantes < 7) {
      for (let i = 1; i <= diasRestantes; i++) {
        const dia = new Date(año, mes + 1, i);
        dias.push({ fecha: dia, esMesActual: false });
      }
    }

    return dias;
  };

  const obtenerRangoHorariosDia = (fecha) => {
    const horariosDelDia = obtenerHorariosDia(fecha);
    if (horariosDelDia.length === 0) return null;

    const horas = horariosDelDia.map((h) => ({
      inicio: new Date(h.inicio_bloque),
      fin: new Date(h.finalizacion_bloque),
    }));

    const horaInicio = horas.reduce(
      (min, h) => (h.inicio < min ? h.inicio : min),
      horas[0].inicio
    );
    const horaFin = horas.reduce(
      (max, h) => (h.fin > max ? h.fin : max),
      horas[0].fin
    );

    return {
      inicio: horaInicio.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      fin: horaFin.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      cantidad: horariosDelDia.length,
    };
  };

  const obtenerHorariosDia = (fecha) => {
    // Obtener fecha sin conversión a UTC
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const fechaStr = `${año}-${mes}-${dia}`;
    
    return horarios
      .filter((h) => {
        // Convertir a hora Chile para comparar fechas
        const fechaChile = utcToChileDate(h.inicio_bloque);
        return fechaChile === fechaStr;
      })
      .sort((a, b) => new Date(a.inicio_bloque) - new Date(b.inicio_bloque));
  };

  const editarHorario = (horario) => {
    setHorarioEditar(horario);
    setShowEditModal(true);
    // Cerrar el modal de detalle si está abierto
    if (showDetalleModal) {
      setShowDetalleModal(false);
    }
  };

  const guardarEdicion = async () => {
    if (!horarioEditar) return;

    try {
      await axios.put(
        `${API_URL}/Horarios/modificar-horario/${horarioEditar.id}`,
        {
          inicio_bloque: horarioEditar.inicio_bloque,
          finalizacion_bloque: horarioEditar.finalizacion_bloque,
        }
      );

      showNotification("success", "Horario actualizado correctamente");
      setShowEditModal(false);
      setHorarioEditar(null);
      
      // Invalidar cache de horarios
      queryClient.invalidateQueries(['horarios', doctorSeleccionado?.id]);
    } catch (error) {
      console.error("Error al actualizar horario:", error);
      showNotification("error", "Error al actualizar horario");
    }
  };

  // Si estamos en vista de creación, mostrar split-screen
  if (vistaCreacion && doctorSeleccionado) {
    const diasConHorario = calcularVistaPrevia();
    const diasMes = obtenerDiasMesVistaPrevia();

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-40 overflow-hidden"
      >
        {/* Notificaciones */}
        <AnimatePresence>
          {notification && (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
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
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-red-100 text-red-600"
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
                    onClick={() => setNotification(null)}
                    className="text-gray-400 hover:text-gray-600"
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

        {/* Header con botón de volver */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setVistaCreacion(false);
                  setFormData({
                    fecha_inicio: new Date().toISOString().split("T")[0],
                    fecha_fin: "",
                    dias_configurados: {
                      0: {
                        activo: false,
                        hora_inicio: "08:00",
                        hora_fin: "18:00",
                        duracion_bloque_minutos: 30,
                      },
                      1: {
                        activo: false,
                        hora_inicio: "08:00",
                        hora_fin: "18:00",
                        duracion_bloque_minutos: 30,
                      },
                      2: {
                        activo: false,
                        hora_inicio: "08:00",
                        hora_fin: "18:00",
                        duracion_bloque_minutos: 30,
                      },
                      3: {
                        activo: false,
                        hora_inicio: "08:00",
                        hora_fin: "18:00",
                        duracion_bloque_minutos: 30,
                      },
                      4: {
                        activo: false,
                        hora_inicio: "08:00",
                        hora_fin: "18:00",
                        duracion_bloque_minutos: 30,
                      },
                      5: {
                        activo: false,
                        hora_inicio: "08:00",
                        hora_fin: "18:00",
                        duracion_bloque_minutos: 30,
                      },
                      6: {
                        activo: false,
                        hora_inicio: "08:00",
                        hora_fin: "18:00",
                        duracion_bloque_minutos: 30,
                      },
                    },
                  });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Volver
              </button>
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Configurar Horarios
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatearNombreCompleto(doctorSeleccionado)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Indicador de conflictos */}
              {diasConHorario.some(d => d.tieneConflicto) && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    {diasConHorario.filter(d => d.tieneConflicto).length} conflicto(s)
                  </span>
                </div>
              )}
              
              <button
                onClick={crearHorarioSemanal}
                disabled={
                  loading ||
                  !Object.values(formData.dias_configurados).some((d) => d.activo)
                }
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creando...
                </>
              ) : (
                <>
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
                  Crear Horarios
                </>
              )}
            </button>
            </div>
          </div>
        </div>

        {/* Split Screen: Izquierda (Configuración) | Derecha (Vista Previa) */}
        <div className="flex h-[calc(100vh-88px)]">
          {/* Panel Izquierdo - Configuración */}
          <div className="w-1/2 overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="p-8 space-y-6">
              {/* Rango de Fechas */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-blue-500"
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
                  Rango de Fechas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha Inicio *
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fecha_inicio: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha Fin (opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_fin}
                      onChange={(e) =>
                        setFormData({ ...formData, fecha_fin: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Por defecto: 3 meses
                    </p>
                  </div>
                </div>
              </div>

              {/* Configuración por Día */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Días de la Semana
                </h3>
                <div className="space-y-3">
                  {diasSemana.map((dia, index) => {
                    const config = formData.dias_configurados[index];
                    return (
                      <motion.div
                        key={index}
                        layout
                        className={`border rounded-xl transition-all duration-200 ${
                          config.activo
                            ? "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-md"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={config.activo}
                                onChange={() => toggleDia(index)}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                              />
                              <span
                                className={`text-lg font-semibold ${
                                  config.activo
                                    ? "text-blue-700 dark:text-blue-300"
                                    : "text-gray-600 dark:text-gray-400"
                                }`}
                              >
                                {dia}
                              </span>
                            </label>
                            {config.activo && (
                              <span className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full font-medium">
                                Activo
                              </span>
                            )}
                          </div>

                          <AnimatePresence>
                            {config.activo && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="grid grid-cols-3 gap-3 pt-3 border-t border-blue-200 dark:border-blue-800"
                              >
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Hora Inicio
                                  </label>
                                  <input
                                    type="time"
                                    value={config.hora_inicio}
                                    onChange={(e) =>
                                      actualizarConfigDia(
                                        index,
                                        "hora_inicio",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Hora Fin
                                  </label>
                                  <input
                                    type="time"
                                    value={config.hora_fin}
                                    onChange={(e) =>
                                      actualizarConfigDia(
                                        index,
                                        "hora_fin",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Duración
                                  </label>
                                  <select
                                    value={config.duracion_bloque_minutos}
                                    onChange={(e) =>
                                      actualizarConfigDia(
                                        index,
                                        "duracion_bloque_minutos",
                                        parseInt(e.target.value)
                                      )
                                    }
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white"
                                  >
                                    <option value={15}>15 min</option>
                                    <option value={30}>30 min</option>
                                    <option value={45}>45 min</option>
                                    <option value={60}>60 min</option>
                                  </select>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho - Vista Previa del Calendario */}
          <div className="w-1/2 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="p-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header del calendario */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-6 py-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">
                      Vista Previa del Mes
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cambiarMesVistaPrevia(-1)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="Mes anterior"
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
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => cambiarMesVistaPrevia(1)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="Mes siguiente"
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-blue-100 text-sm">
                    {mesVistaPrevia
                      .toLocaleDateString("es-CL", {
                        month: "long",
                        year: "numeric",
                      })
                      .toUpperCase()}
                  </p>
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 dark:bg-gray-900/50">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {
                        Object.values(formData.dias_configurados).filter(
                          (d) => d.activo
                        ).length
                      }
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Días activos
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {diasConHorario.filter(d => !d.tieneConflicto).length}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Días válidos
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {diasConHorario.filter(d => d.tieneConflicto).length}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Conflictos
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {diasConHorario.reduce((sum, d) => {
                        const inicio = new Date(
                          `2000-01-01T${d.config.hora_inicio}`
                        );
                        const fin = new Date(`2000-01-01T${d.config.hora_fin}`);
                        const bloques = Math.floor(
                          (fin - inicio) /
                            (d.config.duracion_bloque_minutos * 60000)
                        );
                        return sum + bloques;
                      }, 0)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Bloques totales
                    </p>
                  </div>
                </div>

                {/* Calendario */}
                <div className="p-6">
                  <div className="grid grid-cols-7 gap-2 mb-3">
                    {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
                      (dia) => (
                        <div
                          key={dia}
                          className="text-center text-xs font-bold text-gray-600 dark:text-gray-400 uppercase py-2"
                        >
                          {dia}
                        </div>
                      )
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${mesVistaPrevia.getFullYear()}-${mesVistaPrevia.getMonth()}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-7 gap-2"
                    >
                      {diasMes.map((diaObj, index) => {
                        const { fecha, esMesActual } = diaObj;
                        
                        // Verificar si tiene horario planificado
                        const tieneHorario = diasConHorario.some(
                          (d) => d.fecha.toDateString() === fecha.toDateString()
                        );
                        const diaConfig = tieneHorario
                          ? diasConHorario.find(
                              (d) =>
                                d.fecha.toDateString() === fecha.toDateString()
                            )
                          : null;
                        
                        // Verificar si tiene horarios existentes
                        // Obtener fecha sin conversión a UTC
                        const año = fecha.getFullYear();
                        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                        const dia = String(fecha.getDate()).padStart(2, '0');
                        const fechaStr = `${año}-${mes}-${dia}`;
                        
                        const horariosDelDia = horariosExistentes.filter(h => {
                          // Convertir a hora Chile usando la utilidad
                          const fechaChile = utcToChileDate(h.inicio_bloque);
                          return fechaChile === fechaStr;
                        });
                        const tieneHorariosExistentes = horariosDelDia.length > 0;
                        
                        const esHoy =
                          fecha.toDateString() === new Date().toDateString();

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.01 }}
                            className={`aspect-square rounded-lg border p-2 relative ${
                              !esMesActual
                                ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-40"
                                : diaConfig?.tieneConflicto
                                ? "bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-600 shadow-sm"
                                : tieneHorario
                                ? "bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600 shadow-sm hover:shadow-md transition-shadow"
                                : tieneHorariosExistentes
                                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700"
                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            } ${esHoy ? "ring-2 ring-blue-500" : ""}`}
                          >
                            <div
                              className={`text-sm font-semibold ${
                                esHoy
                                  ? "bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                  : diaConfig?.tieneConflicto
                                  ? "text-red-700 dark:text-red-300"
                                  : tieneHorario
                                  ? "text-blue-700 dark:text-blue-300"
                                  : tieneHorariosExistentes
                                  ? "text-amber-700 dark:text-amber-300"
                                  : esMesActual
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-400"
                              }`}
                            >
                              {fecha.getDate()}
                            </div>

                            {/* Indicador de conflicto */}
                            {diaConfig?.tieneConflicto && esMesActual && (
                              <div className="absolute top-1 right-1" title="Conflicto detectado">
                                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}

                            {/* Horario planificado nuevo */}
                            {tieneHorario && diaConfig && esMesActual && (
                              <div className="mt-1">
                                <div className="text-[10px] font-medium leading-tight flex items-center gap-1">
                                  <span className={diaConfig.tieneConflicto ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"}>
                                    {diaConfig.config.hora_inicio}
                                  </span>
                                </div>
                                <div className="text-[10px] leading-tight">
                                  <span className={diaConfig.tieneConflicto ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}>
                                    {diaConfig.config.hora_fin}
                                  </span>
                                </div>
                                <div className="text-[9px] text-gray-600 dark:text-gray-400 mt-0.5">
                                  {diaConfig.config.duracion_bloque_minutos}min
                                </div>
                                {diaConfig.tieneConflicto && (
                                  <div className="text-[8px] text-red-700 dark:text-red-300 font-bold mt-0.5">
                                    ⚠ {diaConfig.conflictos.length} conflicto(s)
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Horarios existentes (cuando no hay planificado) */}
                            {!tieneHorario && tieneHorariosExistentes && esMesActual && (
                              <div className="mt-1">
                                <div className="text-[9px] text-amber-700 dark:text-amber-300 font-semibold">
                                  ✓ Existente
                                </div>
                                <div className="text-[8px] text-amber-600 dark:text-amber-400">
                                  {horariosDelDia.length} bloque(s)
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Leyenda */}
                <div className="px-6 pb-6">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Leyenda:</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-600"></div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Nuevo horario (válido)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/40 border-2 border-red-400 dark:border-red-600"></div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Conflicto detectado
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700"></div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Horario existente
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded ring-2 ring-blue-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Día actual
                      </span>
                    </div>
                  </div>

                  {/* Alerta de conflictos */}
                  {diasConHorario.some(d => d.tieneConflicto) && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-red-800 dark:text-red-200">
                            Conflictos detectados
                          </h4>
                          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                            Hay {diasConHorario.filter(d => d.tieneConflicto).length} día(s) con solapamientos de horarios.
                            El backend omitirá automáticamente los bloques conflictivos al crear.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Vista normal (lista de horarios)
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

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Gestión de Horarios
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">
                  Asigna horarios de atención a los doctores
                </p>
              </div>
            </motion.div>

            {/* Selector de Doctor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Seleccionar Doctor
              </label>
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={
                      doctorSeleccionado
                        ? formatearNombreCompleto(doctorSeleccionado)
                        : busquedaDoctor
                    }
                    onChange={(e) => {
                      setBusquedaDoctor(e.target.value);
                      setMostrarDropdown(true);
                      if (!e.target.value) {
                        setDoctorSeleccionado(null);
                      }
                    }}
                    onFocus={() => setMostrarDropdown(true)}
                    placeholder="Buscar doctor por nombre..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white pr-10 transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {mostrarDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMostrarDropdown(false)}
                    />
                    <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {doctoresFiltrados.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                          No se encontraron doctores
                        </div>
                      ) : (
                        doctoresFiltrados.map((doctor) => (
                          <button
                            key={doctor.id}
                            onClick={() => {
                              setDoctorSeleccionado(doctor);
                              setBusquedaDoctor("");
                              setMostrarDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                              doctorSeleccionado?.id === doctor.id
                                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            <div className="font-medium">
                              {formatearNombreCompleto(doctor)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              RUT: {doctor.rut || "N/A"}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {doctorSeleccionado && (
              <>
                {/* Acciones y Filtros */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex flex-wrap gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setVistaCreacion(true)}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-bold"
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
                      Crear Horario Semanal
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={eliminarTodosHorarios}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-bold"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Eliminar Todos
                    </motion.button>
                  </div>

                  {/* Toggle Vista Semanal/Mensual */}
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setVistaCalendario("semana")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        vistaCalendario === "semana"
                          ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      Semanal
                    </button>
                    <button
                      onClick={() => setVistaCalendario("mes")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        vistaCalendario === "mes"
                          ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      Mensual
                    </button>
                  </div>
                </motion.div>

                {/* Navegación */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        vistaCalendario === "semana"
                          ? cambiarSemana(-1)
                          : cambiarMes(-1)
                      }
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-6 h-6 text-gray-600 dark:text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                        {fechaActual.toLocaleDateString("es-CL", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      {vistaCalendario === "semana" && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Semana del{" "}
                          {new Date(
                            fechaActual.getFullYear(),
                            fechaActual.getMonth(),
                            fechaActual.getDate() - fechaActual.getDay() + 1
                          ).toLocaleDateString("es-CL")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        vistaCalendario === "semana"
                          ? cambiarSemana(1)
                          : cambiarMes(1)
                      }
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-6 h-6 text-gray-600 dark:text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </motion.div>

                {/* Calendario */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Horarios de {formatearNombreCompleto(doctorSeleccionado)}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Total de bloques: {horarios.length}
                    </p>
                  </div>

                  {loadingHorarios ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Cargando horarios...
                    </div>
                  ) : vistaCalendario === "semana" ? (
                    <div className="p-6">
                      {/* Grid de días de la semana */}
                      <div className="grid grid-cols-7 gap-2">
                        {obtenerDiasSemana().map((dia, index) => {
                          const horariosDelDia = obtenerHorariosDia(dia);
                          const esHoy =
                            dia.toDateString() === new Date().toDateString();

                          return (
                            <div key={index} className="min-h-[200px]">
                              {/* Header del día */}
                              <div
                                className={`text-center p-3 rounded-t-lg ${
                                  esHoy
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                }`}
                              >
                                <p className="text-xs font-semibold uppercase">
                                  {dia.toLocaleDateString("es-CL", {
                                    weekday: "short",
                                  })}
                                </p>
                                <p className="text-lg font-bold mt-1">
                                  {dia.getDate()}
                                </p>
                              </div>

                              {/* Horarios del día */}
                              <div className="border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg p-2 space-y-2 min-h-[150px] bg-gray-50 dark:bg-gray-800/50">
                                {horariosDelDia.length === 0 ? (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
                                    Sin horarios
                                  </p>
                                ) : (
                                  horariosDelDia.map((horario) => (
                                    <div
                                      key={horario.id}
                                      className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded p-2 hover:shadow-md transition-shadow cursor-pointer group"
                                      onClick={() => editarHorario(horario)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300 text-xs font-semibold">
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
                                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                          </svg>
                                          {new Date(
                                            horario.inicio_bloque
                                          ).toLocaleTimeString("es-CL", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            confirmarEliminacion(horario.id);
                                          }}
                                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-opacity"
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
                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        {new Date(
                                          horario.finalizacion_bloque
                                        ).toLocaleTimeString("es-CL", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {Math.round(
                                          (new Date(
                                            horario.finalizacion_bloque
                                          ) -
                                            new Date(horario.inicio_bloque)) /
                                            60000
                                        )}{" "}
                                        min
                                      </p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      {/* Headers días de la semana */}
                      <div className="grid grid-cols-7 gap-2 mb-2">
                        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
                          (dia) => (
                            <div
                              key={dia}
                              className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase py-2"
                            >
                              {dia}
                            </div>
                          )
                        )}
                      </div>

                      {/* Grid del mes */}
                      <div className="grid grid-cols-7 gap-2">
                        {obtenerDiasMes().map((diaObj, index) => {
                          const { fecha, esMesActual } = diaObj;
                          const rangoHorarios = obtenerRangoHorariosDia(fecha);
                          const esHoy =
                            fecha.toDateString() === new Date().toDateString();

                          return (
                            <div
                              key={index}
                              className={`min-h-[100px] border rounded-lg p-2 ${
                                esMesActual
                                  ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                  : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-50"
                              } ${esHoy ? "ring-2 ring-blue-500" : ""}`}
                            >
                              {/* Número del día */}
                              <div
                                className={`text-sm font-semibold mb-2 ${
                                  esHoy
                                    ? "bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                                    : esMesActual
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-400 dark:text-gray-600"
                                }`}
                              >
                                {fecha.getDate()}
                              </div>

                              {/* Rango de horarios */}
                              {rangoHorarios && esMesActual && (
                                <div
                                  className="space-y-1 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded p-1 transition-colors"
                                  onClick={() => {
                                    setDiaSeleccionado(fecha);
                                    setShowDetalleModal(true);
                                  }}
                                >
                                  <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded p-2 text-xs">
                                    <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300 font-semibold">
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
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      {rangoHorarios.inicio}
                                    </div>
                                    <div className="text-blue-600 dark:text-blue-400 mt-1">
                                      {rangoHorarios.fin}
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400 text-xs mt-1 flex items-center justify-between">
                                      <span>
                                        {rangoHorarios.cantidad} bloques
                                      </span>
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
                                          d="M9 5l7 7-7 7"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full my-8"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Configurar Horarios Semanales
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Selecciona los días y configura horarios personalizados para
                  cada uno
                </p>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Rango de Fechas */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-500"
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
                    Rango de Fechas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha Inicio *
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_inicio}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fecha_inicio: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha Fin (opcional)
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_fin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fecha_fin: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Si no se especifica, se crearán por 3 meses
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configuración por Día */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Días de la Semana
                  </h3>
                  <div className="space-y-3">
                    {diasSemana.map((dia, index) => {
                      const config = formData.dias_configurados[index];
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`border rounded-xl transition-all duration-200 ${
                            config.activo
                              ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"
                          }`}
                        >
                          {/* Toggle del día */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={config.activo}
                                  onChange={() => toggleDia(index)}
                                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                />
                                <span
                                  className={`text-base font-semibold ${
                                    config.activo
                                      ? "text-blue-700 dark:text-blue-300"
                                      : "text-gray-600 dark:text-gray-400"
                                  }`}
                                >
                                  {dia}
                                </span>
                              </label>
                              {config.activo && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                                  Activo
                                </span>
                              )}
                            </div>

                            {/* Configuración del horario (solo si está activo) */}
                            <AnimatePresence>
                              {config.activo && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3"
                                >
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                      Hora Inicio
                                    </label>
                                    <input
                                      type="time"
                                      value={config.hora_inicio}
                                      onChange={(e) =>
                                        actualizarConfigDia(
                                          index,
                                          "hora_inicio",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                      Hora Fin
                                    </label>
                                    <input
                                      type="time"
                                      value={config.hora_fin}
                                      onChange={(e) =>
                                        actualizarConfigDia(
                                          index,
                                          "hora_fin",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                      Duración de Bloque
                                    </label>
                                    <select
                                      value={config.duracion_bloque_minutos}
                                      onChange={(e) =>
                                        actualizarConfigDia(
                                          index,
                                          "duracion_bloque_minutos",
                                          parseInt(e.target.value)
                                        )
                                      }
                                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white"
                                    >
                                      <option value={15}>15 min</option>
                                      <option value={30}>30 min</option>
                                      <option value={45}>45 min</option>
                                      <option value={60}>60 min</option>
                                    </select>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Vista Previa */}
                {Object.values(formData.dias_configurados).some(
                  (d) => d.activo
                ) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
                  >
                    <div className="flex gap-3">
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-semibold mb-2">
                          Resumen de configuración:
                        </p>
                        <ul className="space-y-1">
                          {Object.entries(formData.dias_configurados)
                            .filter(([_, config]) => config.activo)
                            .map(([index, config]) => (
                              <li
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                <strong>{diasSemana[index]}:</strong>
                                <span>
                                  {config.hora_inicio} - {config.hora_fin}
                                </span>
                                <span className="text-blue-600 dark:text-blue-400">
                                  ({config.duracion_bloque_minutos} min)
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
                <button
                  onClick={() => {
                    setShowModal(false);
                    // Resetear form
                    setFormData({
                      fecha_inicio: new Date().toISOString().split("T")[0],
                      fecha_fin: "",
                      dias_configurados: {
                        0: {
                          activo: false,
                          hora_inicio: "08:00",
                          hora_fin: "18:00",
                          duracion_bloque_minutos: 30,
                        },
                        1: {
                          activo: false,
                          hora_inicio: "08:00",
                          hora_fin: "18:00",
                          duracion_bloque_minutos: 30,
                        },
                        2: {
                          activo: false,
                          hora_inicio: "08:00",
                          hora_fin: "18:00",
                          duracion_bloque_minutos: 30,
                        },
                        3: {
                          activo: false,
                          hora_inicio: "08:00",
                          hora_fin: "18:00",
                          duracion_bloque_minutos: 30,
                        },
                        4: {
                          activo: false,
                          hora_inicio: "08:00",
                          hora_fin: "18:00",
                          duracion_bloque_minutos: 30,
                        },
                        5: {
                          activo: false,
                          hora_inicio: "08:00",
                          hora_fin: "18:00",
                          duracion_bloque_minutos: 30,
                        },
                        6: {
                          activo: false,
                          hora_inicio: "08:00",
                          hora_fin: "18:00",
                          duracion_bloque_minutos: 30,
                        },
                      },
                    });
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearHorarioSemanal}
                  disabled={
                    loading ||
                    !Object.values(formData.dias_configurados).some(
                      (d) => d.activo
                    )
                  }
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/30"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creando...
                    </>
                  ) : (
                    <>
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
                      Crear Horarios
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Editar Horario */}
      <AnimatePresence>
        {showEditModal && horarioEditar && (
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
                  Editar Horario
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora Inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      horarioEditar.inicio_bloque
                        ? new Date(horarioEditar.inicio_bloque)
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      setHorarioEditar({
                        ...horarioEditar,
                        inicio_bloque: new Date(e.target.value).toISOString(),
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      horarioEditar.finalizacion_bloque
                        ? new Date(horarioEditar.finalizacion_bloque)
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      setHorarioEditar({
                        ...horarioEditar,
                        finalizacion_bloque: new Date(
                          e.target.value
                        ).toISOString(),
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    ⚠️ Asegúrate de que el nuevo horario no se solape con otros
                    existentes
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setHorarioEditar(null);
                  }}
                  className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarEdicion}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold"
                >
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Lateral de Detalle del Día */}
      <AnimatePresence>
        {showDetalleModal && diaSeleccionado && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowDetalleModal(false)}
            />

            {/* Modal Slide-in desde la derecha */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {diaSeleccionado.toLocaleDateString("es-CL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {obtenerHorariosDia(diaSeleccionado).length} bloques de
                    horario
                  </p>
                </div>
                <button
                  onClick={() => setShowDetalleModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
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
                </button>
              </div>

              {/* Lista de bloques */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-3">
                  {obtenerHorariosDia(diaSeleccionado).length === 0 ? (
                    <div className="text-center py-12">
                      <svg
                        className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">
                        No hay horarios para este día
                      </p>
                    </div>
                  ) : (
                    obtenerHorariosDia(diaSeleccionado).map(
                      (horario, index) => (
                        <motion.div
                          key={horario.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-blue-500 p-2 rounded-lg">
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
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
                                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {new Date(
                                      horario.inicio_bloque
                                    ).toLocaleTimeString("es-CL", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Hora de inicio
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 ml-11">
                                <div className="flex items-center gap-1">
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
                                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                  </svg>
                                  <span>
                                    {new Date(
                                      horario.finalizacion_bloque
                                    ).toLocaleTimeString("es-CL", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
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
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span className="font-semibold">
                                    {Math.round(
                                      (new Date(horario.finalizacion_bloque) -
                                        new Date(horario.inicio_bloque)) /
                                        60000
                                    )}{" "}
                                    min
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => editarHorario(horario)}
                                className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="Editar horario"
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
                              </button>
                              <button
                                onClick={() => confirmarEliminacion(horario.id)}
                                className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Eliminar horario"
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    )
                  )}
                </div>
              </div>

              {/* Footer con información adicional */}
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-6 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total de bloques:
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {obtenerHorariosDia(diaSeleccionado).length}
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Confirmación de Eliminación */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 flex items-center gap-3">
                <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-full">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
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
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Confirmar eliminación
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-4">
                <p className="text-gray-700 dark:text-gray-300">
                  ¿Está seguro de que desea eliminar este bloque de horario?
                  Esta acción es permanente y no se puede revertir.
                </p>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setHorarioAEliminar(null);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={eliminarHorario}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
