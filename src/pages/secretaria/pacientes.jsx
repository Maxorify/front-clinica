import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_URL = "http://localhost:5000";

const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];
const monthNames = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseIsoDate = (iso) => {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return startOfDay(new Date(year, month - 1, day));
};

const formatIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const clampDateToRange = (date, minDate, maxDate) => {
  let result = startOfDay(date);
  if (minDate && result < minDate) result = minDate;
  if (maxDate && result > maxDate) result = maxDate;
  return result;
};

const getMonthStart = (year, month) => startOfDay(new Date(year, month, 1));
const getMonthEnd = (year, month) => startOfDay(new Date(year, month + 1, 0));

const ensureViewWithinRange = (year, month, minDate, maxDate) => {
  const start = getMonthStart(year, month);
  const end = getMonthEnd(year, month);

  if (minDate && end < minDate) {
    return getMonthStart(minDate.getFullYear(), minDate.getMonth());
  }

  if (maxDate && start > maxDate) {
    return getMonthStart(maxDate.getFullYear(), maxDate.getMonth());
  }

  return start;
};

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  return a.getTime() === b.getTime();
};

const isDateDisabled = (date, minDate, maxDate) => {
  if (minDate && date < minDate) return true;
  if (maxDate && date > maxDate) return true;
  return false;
};

const isMonthDisabled = (year, month, minDate, maxDate) => {
  const start = getMonthStart(year, month);
  const end = getMonthEnd(year, month);
  if (minDate && end < minDate) return true;
  if (maxDate && start > maxDate) return true;
  return false;
};

function DatePicker({
  value,
  onChange,
  min,
  max,
  name,
  required,
  className,
  placeholder = "dd/mm/aaaa",
}) {
  const containerRef = useRef(null);
  const minDate = useMemo(() => (min ? parseIsoDate(min) : null), [min]);
  const maxDate = useMemo(() => (max ? parseIsoDate(max) : null), [max]);
  const selectedDate = useMemo(
    () => (value ? parseIsoDate(value) : null),
    [value]
  );
  const today = useMemo(() => startOfDay(new Date()), []);
  const safeToday = useMemo(
    () => clampDateToRange(today, minDate, maxDate),
    [today, minDate, maxDate]
  );
  const todaySelectable = !isDateDisabled(today, minDate, maxDate);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() =>
    ensureViewWithinRange(
      (selectedDate ?? safeToday).getFullYear(),
      (selectedDate ?? safeToday).getMonth(),
      minDate,
      maxDate
    )
  );

  const selectedTime = selectedDate ? selectedDate.getTime() : null;

  useEffect(() => {
    setViewDate((prev) => {
      const base = selectedDate ?? prev;
      return ensureViewWithinRange(
        base.getFullYear(),
        base.getMonth(),
        minDate,
        maxDate
      );
    });
  }, [selectedTime, selectedDate, minDate, maxDate]);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const minYear = minDate ? minDate.getFullYear() : 1900;
  const maxYear = maxDate ? maxDate.getFullYear() : today.getFullYear();

  const yearOptions = useMemo(() => {
    const years = [];
    for (let year = minYear; year <= maxYear; year++) {
      const fullYearDisabled =
        (minDate && getMonthEnd(year, 11) < minDate) ||
        (maxDate && getMonthStart(year, 0) > maxDate);
      if (!fullYearDisabled) {
        years.push(year);
      }
    }
    return years;
  }, [minYear, maxYear, minDate, maxDate]);

  const monthOptions = useMemo(
    () =>
      monthNames.map((label, index) => ({
        label,
        value: index,
        disabled: isMonthDisabled(currentYear, index, minDate, maxDate),
      })),
    [currentYear, minDate, maxDate]
  );

  const calendarDays = useMemo(() => {
    const start = getMonthStart(currentYear, currentMonth);
    const offset = (start.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) =>
      startOfDay(new Date(currentYear, currentMonth, index - offset + 1))
    );
  }, [currentYear, currentMonth]);

  const prevMonthStart = getMonthStart(currentYear, currentMonth - 1);
  const prevMonthEnd = getMonthEnd(
    prevMonthStart.getFullYear(),
    prevMonthStart.getMonth()
  );
  const nextMonthStart = getMonthStart(currentYear, currentMonth + 1);

  const prevDisabled = minDate ? prevMonthEnd < minDate : false;
  const nextDisabled = maxDate ? nextMonthStart > maxDate : false;

  const handleMonthChange = (delta) => {
    setViewDate((current) => {
      const next = ensureViewWithinRange(
        current.getFullYear(),
        current.getMonth() + delta,
        minDate,
        maxDate
      );
      return next;
    });
  };

  const handleMonthSelect = (event) => {
    const newMonth = Number(event.target.value);
    if (Number.isNaN(newMonth)) return;
    if (isMonthDisabled(currentYear, newMonth, minDate, maxDate)) return;
    setViewDate((current) =>
      ensureViewWithinRange(current.getFullYear(), newMonth, minDate, maxDate)
    );
  };

  const handleYearSelect = (event) => {
    const newYear = Number(event.target.value);
    if (Number.isNaN(newYear)) return;
    setViewDate((current) =>
      ensureViewWithinRange(newYear, current.getMonth(), minDate, maxDate)
    );
  };

  const handleSelect = (date) => {
    if (isDateDisabled(date, minDate, maxDate)) return;
    onChange?.(formatIsoDate(date));
    setOpen(false);
  };

  const handleClear = () => {
    onChange?.("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`${className} flex items-center justify-between gap-3 text-left`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span
          className={
            value
              ? "text-gray-900 dark:text-white truncate"
              : "text-gray-400 dark:text-gray-500 truncate"
          }
        >
          {value && selectedDate
            ? formatDisplayDate(selectedDate)
            : placeholder}
        </span>
        <svg
          className="h-5 w-5 text-gray-400 dark:text-gray-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 2v2m8-2v2m-9 4h10m-12 0h14m0 0v12a2 2 0 01-2 2H7a2 2 0 01-2-2V8m5 4h.01m3.99 0h.01m3.99 0h.01m-8 4h.01m3.99 0h.01m3.99 0h.01"
          />
        </svg>
      </button>
      <input
        type="text"
        name={name}
        value={value || ""}
        readOnly
        required={required}
        className="sr-only"
        tabIndex={-1}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 z-50 mt-2 w-full min-w-[16rem] rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900 sm:w-80"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleMonthChange(-1)}
                disabled={prevDisabled}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                aria-label="Mes anterior"
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
                    strokeWidth={1.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <select
                  value={currentMonth}
                  onChange={handleMonthSelect}
                  className="rounded-lg border border-gray-200 bg-transparent px-3 py-1 text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:text-gray-200 dark:focus:ring-blue-500"
                >
                  {monthOptions.map(
                    ({ label, value: optionValue, disabled }) => (
                      <option
                        key={optionValue}
                        value={optionValue}
                        disabled={disabled}
                      >
                        {label.charAt(0).toUpperCase() + label.slice(1)}
                      </option>
                    )
                  )}
                </select>
                <select
                  value={currentYear}
                  onChange={handleYearSelect}
                  className="rounded-lg border border-gray-200 bg-transparent px-3 py-1 text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:text-gray-200 dark:focus:ring-blue-500"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleMonthChange(1)}
                disabled={nextDisabled}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                aria-label="Mes siguiente"
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
                    strokeWidth={1.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {dayLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date) => {
                const disabled = isDateDisabled(date, minDate, maxDate);
                const selected = selectedDate
                  ? isSameDay(date, selectedDate)
                  : false;
                const todayMatch = isSameDay(date, today);
                const inCurrentMonth =
                  date.getMonth() === currentMonth &&
                  date.getFullYear() === currentYear;

                let dayClass =
                  "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition focus:outline-none";

                if (selected) {
                  dayClass +=
                    " bg-blue-500 text-white shadow-lg shadow-blue-500/30";
                } else if (disabled) {
                  dayClass +=
                    " cursor-not-allowed text-gray-300 dark:text-gray-600";
                } else {
                  dayClass +=
                    " cursor-pointer hover:bg-blue-500/10 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-100";
                  dayClass += inCurrentMonth
                    ? " text-gray-700 dark:text-gray-100"
                    : " text-gray-400 dark:text-gray-500";
                }

                if (todayMatch && !selected) {
                  dayClass += " ring-1 ring-blue-400/70 dark:ring-blue-500/60";
                }

                return (
                  <button
                    type="button"
                    key={date.getTime()}
                    onClick={() => handleSelect(date)}
                    disabled={disabled}
                    className={dayClass}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-300">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg px-3 py-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-200"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => handleSelect(safeToday)}
                disabled={!todaySelectable}
                className="rounded-lg px-3 py-2 transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-blue-500/20 dark:hover:text-blue-100"
              >
                Hoy
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [prevenciones, setPrevenciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    fecha_nacimiento: "",
    sexo: "",
    estado_civil: "",
    rut: "",
    direccion: "",
    telefono: "",
    correo: "",
    ocupacion: "",
    persona_responsable: "",
    alergias: "",
    prevencion_id: "",
  });

  const [edad, setEdad] = useState("");

  // Formatear RUT mientras se escribe
  const formatearRut = (rut) => {
    // Remover todo lo que no sea número o K
    const cleaned = rut.replace(/[^0-9kK]/g, "");

    if (cleaned.length <= 1) return cleaned;

    // Separar dígito verificador
    const dv = cleaned.slice(-1);
    let numbers = cleaned.slice(0, -1);

    // Agregar puntos cada 3 dígitos
    numbers = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // Retornar formato completo
    return numbers ? `${numbers}-${dv}` : "";
  };

  // Limpiar RUT (remover puntos y guión)
  const limpiarRut = (rut) => {
    return rut.replace(/[.\-]/g, "");
  };

  // Calcular edad desde fecha de nacimiento
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return "";

    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad.toString();
  };

  // Cargar pacientes y prevenciones al montar el componente
  useEffect(() => {
    cargarPacientes();
    cargarPrevenciones();
  }, []);

  // Actualizar edad cuando cambia la fecha de nacimiento
  useEffect(() => {
    if (formData.fecha_nacimiento) {
      setEdad(calcularEdad(formData.fecha_nacimiento));
    } else {
      setEdad("");
    }
  }, [formData.fecha_nacimiento]);

  // Ocultar automáticamente la notificación después de unos segundos
  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => setNotification(null), 4000);

    return () => clearTimeout(timer);
  }, [notification]);

  const showNotification = (type, message) => {
    setNotification({ id: Date.now(), type, message });
  };

  const cargarPacientes = async () => {
    try {
      const response = await axios.get(`${API_URL}/Pacientes/listar-pacientes`);
      setPacientes(response.data.pacientes);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error al cargar pacientes:", error);
        showNotification("error", "Error al cargar pacientes");
      }
    }
  };

  const cargarPrevenciones = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/Pacientes/listar-prevenciones`
      );
      setPrevenciones(response.data.prevenciones);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error al cargar prevenciones:", error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "rut") {
      // Formatear RUT mientras se escribe
      const rutFormateado = formatearRut(value);
      setFormData({ ...formData, [name]: rutFormateado });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Preparar datos para enviar (limpiar RUT)
      const dataToSend = {
        ...formData,
        rut: limpiarRut(formData.rut),
        prevencion_id: parseInt(formData.prevencion_id),
      };

      if (editingId) {
        // Actualizar paciente
        await axios.put(
          `${API_URL}/Pacientes/modificar-paciente/${editingId}`,
          dataToSend
        );
        showNotification("success", "Paciente actualizado correctamente");
      } else {
        // Crear nuevo paciente
        await axios.post(`${API_URL}/Pacientes/crear-paciente`, dataToSend);
        showNotification("success", "Paciente creado correctamente");
      }

      // Recargar lista y cerrar modal
      await cargarPacientes();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar paciente:", error);
      showNotification(
        "error",
        error.response?.data?.detail || "Error al guardar paciente"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (paciente) => {
    setEditingId(paciente.id);
    setFormData({
      nombre: paciente.nombre,
      apellido_paterno: paciente.apellido_paterno || "",
      apellido_materno: paciente.apellido_materno || "",
      fecha_nacimiento: paciente.fecha_nacimiento || "",
      sexo: paciente.sexo || "",
      estado_civil: paciente.estado_civil || "",
      rut: formatearRut(paciente.rut),
      direccion: paciente.direccion || "",
      telefono: paciente.telefono || "",
      correo: paciente.correo || "",
      ocupacion: paciente.ocupacion || "",
      persona_responsable: paciente.persona_responsable || "",
      alergias: paciente.alergias || "",
      prevencion_id: paciente.prevencion_id?.toString() || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Está seguro de eliminar al paciente ${nombre}?`)) return;

    try {
      await axios.delete(`${API_URL}/Pacientes/eliminar-paciente/${id}`);
      showNotification("success", "Paciente eliminado correctamente");
      await cargarPacientes();
    } catch (error) {
      console.error("Error al eliminar paciente:", error);
      showNotification(
        "error",
        error.response?.data?.detail || "Error al eliminar paciente"
      );
    }
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      nombre: "",
      apellido_paterno: "",
      apellido_materno: "",
      fecha_nacimiento: "",
      sexo: "",
      estado_civil: "",
      rut: "",
      direccion: "",
      telefono: "",
      correo: "",
      ocupacion: "",
      persona_responsable: "",
      alergias: "",
      prevencion_id: "",
    });
    setEdad("");
  };

  const filteredPacientes = pacientes.filter(
    (p) =>
      p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.apellido_paterno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.apellido_materno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rut?.includes(searchTerm.replace(/[.\-]/g, "")) ||
      p.correo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                      ? "Accion completada"
                      : "Ocurrio un problema"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {notification.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotification(null)}
                  className="ml-3 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Cerrar notificacion"
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
              Pacientes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestión de pacientes registrados
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
            Nuevo Paciente
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre, RUT o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

        {/* Patients Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    RUT
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Previsión
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPacientes.map((paciente) => (
                  <tr
                    key={paciente.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {paciente.nombre?.charAt(0)}
                          {paciente.apellido_paterno?.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {paciente.nombre} {paciente.apellido_paterno}{" "}
                            {paciente.apellido_materno}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatearRut(paciente.rut)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {paciente.telefono}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {paciente.correo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {paciente.prevencion?.nombre || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(paciente)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
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
                    {editingId ? "Editar Paciente" : "Nuevo Paciente"}
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
                          Apellido Paterno{" "}
                          <span className="text-red-500">*</span>
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
                          Apellido Materno{" "}
                          <span className="text-red-500">*</span>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          Fecha de Nacimiento{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                          name="fecha_nacimiento"
                          value={formData.fecha_nacimiento}
                          onChange={(newValue) =>
                            handleInputChange({
                              target: {
                                name: "fecha_nacimiento",
                                value: newValue,
                              },
                            })
                          }
                          min="1900-01-01"
                          max={new Date().toISOString().split("T")[0]}
                          required
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                          placeholder="dd/mm/aaaa"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Edad
                        </label>
                        <input
                          type="text"
                          value={edad ? `${edad} años` : ""}
                          readOnly
                          disabled
                          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Datos Demográficos */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Datos Demográficos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Sexo <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="sexo"
                          value={formData.sexo}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        >
                          <option value="">Seleccione...</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Femenino">Femenino</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Estado Civil <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="estado_civil"
                          value={formData.estado_civil}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        >
                          <option value="">Seleccione...</option>
                          <option value="Soltero">Soltero/a</option>
                          <option value="Casado">Casado/a</option>
                          <option value="Divorciado">Divorciado/a</option>
                          <option value="Viudo">Viudo/a</option>
                          <option value="Conviviente">Conviviente</option>
                        </select>
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
                          Teléfono <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleInputChange}
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
                          name="correo"
                          value={formData.correo}
                          onChange={handleInputChange}
                          required
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

                  {/* Información Adicional */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Información Adicional
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ocupación <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="ocupacion"
                          value={formData.ocupacion}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Previsión <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="prevencion_id"
                          value={formData.prevencion_id}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        >
                          <option value="">Seleccione...</option>
                          {prevenciones.map((prev) => (
                            <option key={prev.id} value={prev.id}>
                              {prev.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Persona Responsable{" "}
                          <span className="text-gray-400">(Opcional)</span>
                        </label>
                        <input
                          type="text"
                          name="persona_responsable"
                          value={formData.persona_responsable}
                          onChange={handleInputChange}
                          placeholder="Para pacientes menores de edad"
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Alergias{" "}
                          <span className="text-gray-400">(Opcional)</span>
                        </label>
                        <textarea
                          name="alergias"
                          value={formData.alergias}
                          onChange={handleInputChange}
                          rows="2"
                          placeholder="Describa las alergias conocidas..."
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none"
                        />
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
                      disabled={loading}
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
      </div>
    </>
  );
}
