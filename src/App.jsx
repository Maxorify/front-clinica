import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Login from "./pages/login/Login";
import CambiarContrasena from "./pages/auth/CambiarContrasena";
import ProtectedRoute from "./components/ProtectedRoute";

// Layouts
import Layout from "./components/layout/Layout";
import LayoutDoctor from "./components/layout/LayoutDoctor";
import LayoutSecretaria from "./components/layout/LayoutSecretaria";

// Admin Pages
import Dashboard from "./pages/admin/dashboard";
import AgendamientoConsultas from "./pages/admin/agendamientoConsultas";
import Doctores from "./pages/admin/doctores";
import Pacientes from "./pages/admin/pacientes";
import UsuariosSistema from "./pages/admin/usuariosSistema";
import Especialidades from "./pages/admin/especialidades";
import AsignarHorarios from "./pages/admin/asignarHorarios";
import AjustesSistema from "./pages/admin/miPerfil";
import Asistencia from "./pages/admin/asistencia";
import BoletasGeneradas from "./pages/admin/boletasGeneradas";

// Doctor Pages
import DashboardDoctor from "./pages/doctor/DashboardDoctor";
import CitasDoctor from "./pages/doctor/CitasDoctor";
import HistoriaMedica from "./pages/doctor/historiaMedica";
import MiPerfil from "./pages/doctor/miPerfil";

// Secretaria Pages
import DashboardSecretaria from "./pages/secretaria/dashboardSecretaria";
import CajaPagos from "./pages/secretaria/cajaPagos";
import EditarPerfil from "./pages/secretaria/editarPerfil";
import Recepcion from "./pages/secretaria/recepcion";
import PacientesSecretaria from "./pages/secretaria/pacientes";

import "./App.css";

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Login />} />
        <Route path="/cambiar-contrasena" element={<CambiarContrasena />} />

        {/* Rutas Admin */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/recepcion" element={<Recepcion />} />
          <Route
            path="/admin/agendamiento"
            element={<AgendamientoConsultas />}
          />
          <Route path="/admin/doctores" element={<Doctores />} />
          <Route path="/admin/pacientes" element={<Pacientes />} />
          <Route path="/admin/usuarios-sistema" element={<UsuariosSistema />} />
          <Route path="/admin/especialidades" element={<Especialidades />} />
          <Route path="/admin/asignar-horarios" element={<AsignarHorarios />} />
          <Route path="/admin/asistencia" element={<Asistencia />} />
          <Route path="/admin/ajustes-sistema" element={<AjustesSistema />} />
          <Route
            path="/admin/boletas-generadas"
            element={<BoletasGeneradas />}
          />
        </Route>

        {/* Rutas Doctor */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["medico"]}>
              <LayoutDoctor />
            </ProtectedRoute>
          }
        >
          <Route path="/doctor/dashboard" element={<DashboardDoctor />} />
          <Route path="/doctor/citas" element={<CitasDoctor />} />
          <Route path="/doctor/historial" element={<HistoriaMedica />} />
          <Route path="/doctor/perfil" element={<MiPerfil />} />
        </Route>

        {/* Rutas Secretaria */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["secretaria"]}>
              <LayoutSecretaria />
            </ProtectedRoute>
          }
        >
          <Route
            path="/secretaria/dashboard"
            element={<DashboardSecretaria />}
          />
          <Route path="/secretaria/recepcion" element={<Recepcion />} />
          <Route
            path="/secretaria/agendamiento"
            element={<AgendamientoConsultas />}
          />
          <Route
            path="/secretaria/pacientes"
            element={<PacientesSecretaria />}
          />
          <Route path="/secretaria/asistencia" element={<Asistencia />} />
          <Route path="/secretaria/editar-perfil" element={<EditarPerfil />} />
          <Route
            path="/secretaria/boletas-generadas"
            element={<BoletasGeneradas />}
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default App;
