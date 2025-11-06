import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardDoctor() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    citas_hoy: 0,
    atendidos_hoy: 0,
    pendientes_hoy: 0,
    cancelados_hoy: 0,
    total_pacientes_mes: 0,
  });
  const [citasHoy, setCitasHoy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const doctorId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");
      const fechaHoy = new Date().toISOString().split("T")[0];

      // Cargar estadísticas
      const statsResponse = await fetch(
        `http://localhost:5000/Citas/doctor/${doctorId}/stats?fecha=${fechaHoy}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Cargar citas del día (Pendiente y Confirmada)
      const citasResponse = await fetch(
        `http://localhost:5000/Citas/doctor/${doctorId}/citas?fecha=${fechaHoy}&estados=Pendiente,Confirmada,En Consulta,Completada`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const citasData = await citasResponse.json();
      setCitasHoy(citasData.citas || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCitaClick = (citaId) => {
    // Navegar a Mis Citas con la cita resaltada
    navigate("/doctor/citas", { state: { highlightCitaId: citaId } });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Completada":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "En Consulta":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Confirmada":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl text-gray-600 dark:text-gray-400">
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Doctor
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Bienvenido Dr. {localStorage.getItem("user_name")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Citas Hoy</h3>
          <p className="text-4xl font-bold mt-2">{stats.citas_hoy}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Atendidos Hoy</h3>
          <p className="text-4xl font-bold mt-2">{stats.atendidos_hoy}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Pendientes Hoy</h3>
          <p className="text-4xl font-bold mt-2">{stats.pendientes_hoy}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Cancelados Hoy</h3>
          <p className="text-4xl font-bold mt-2">{stats.cancelados_hoy}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Total Pacientes</h3>
          <p className="text-4xl font-bold mt-2">{stats.total_pacientes_mes}</p>
          <p className="text-xs opacity-75 mt-1">Este mes</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Citas de Hoy
        </h2>
        {citasHoy.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay citas programadas para hoy
          </p>
        ) : (
          <div className="space-y-4">
            {citasHoy.map((cita) => (
              <div
                key={cita.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                onClick={() => handleCitaClick(cita.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {new Date(cita.fecha_atencion).toLocaleTimeString(
                        "es-CL",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {cita.paciente.nombre} {cita.paciente.apellido_paterno}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {cita.motivo_consulta || "Sin motivo especificado"}
                      </p>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                    cita.estado_actual
                  )}`}
                >
                  {cita.estado_actual}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
