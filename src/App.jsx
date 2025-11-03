import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/login/Login'
import ProtectedRoute from './components/ProtectedRoute'

// Layouts
import Layout from './components/layout/Layout'
import LayoutDoctor from './components/layout/LayoutDoctor'
import LayoutSecretaria from './components/layout/LayoutSecretaria'

// Admin Pages
import Dashboard from './pages/admin/dashboard';
import AgendamientoConsultas from './pages/admin/agendamientoConsultas';
import Doctores from './pages/admin/doctores';
import Pacientes from './pages/admin/pacientes';
import UsuariosSistema from './pages/admin/usuariosSistema';
import Especialidades from './pages/admin/especialidades';
import AsignarHorarios from './pages/admin/asignarHorarios';
import RegistroAsistencia from './pages/admin/registroAsistencia';
import AjustesSistema from './pages/admin/ajustesSistema';
import Asistencia from './pages/admin/asistencia';

// Doctor Pages
import DashboardDoctor from './pages/doctor/DashboardDoctor';
import CitasDoctor from './pages/doctor/CitasDoctor';
import PacientesDoctor from './pages/doctor/pacientes';
import HistoriaMedica from './pages/doctor/historiaMedica';
import MiPerfil from './pages/doctor/miPerfil';

// Secretaria Pages
import DashboardSecretaria from './pages/secretaria/dashboardSecretaria';
import AgendarCita from './pages/secretaria/agendarCita';
import CajaPagos from './pages/secretaria/cajaPagos';
import EditarPerfil from './pages/secretaria/editarPerfil';
import CheckingPacientes from './pages/secretaria/checkingPacientes';

import './App.css'

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Login/>} />

      {/* Rutas Admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']}><Layout/></ProtectedRoute>}>
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/agendamiento-consultas" element={<AgendamientoConsultas />} />
        <Route path="/admin/doctores" element={<Doctores />} />
        <Route path="/admin/pacientes" element={<Pacientes />} />
        <Route path="/admin/usuarios-sistema" element={<UsuariosSistema />} />
        <Route path="/admin/especialidades" element={<Especialidades />} />
        <Route path="/admin/asignar-horarios" element={<AsignarHorarios />} />
        <Route path="/admin/registro-asistencia" element={<RegistroAsistencia />} />
        <Route path="/admin/asistencia" element={<Asistencia />} />
        <Route path="/admin/ajustes-sistema" element={<AjustesSistema />} />
      </Route>

      {/* Rutas Doctor */}
      <Route element={<ProtectedRoute allowedRoles={['medico']}><LayoutDoctor/></ProtectedRoute>}>
        <Route path="/doctor/dashboard" element={<DashboardDoctor />} />
        <Route path="/doctor/citas" element={<CitasDoctor />} />
        <Route path="/doctor/pacientes" element={<PacientesDoctor />} />
        <Route path="/doctor/historial" element={<HistoriaMedica />} />
        <Route path="/doctor/perfil" element={<MiPerfil />} />
      </Route>

      {/* Rutas Secretaria */}
      <Route element={<ProtectedRoute allowedRoles={['secretaria']}><LayoutSecretaria/></ProtectedRoute>}>
        <Route path="/secretaria/dashboard" element={<DashboardSecretaria />} />
        <Route path="/secretaria/agendar-cita" element={<AgendarCita />} />
        <Route path="/secretaria/caja-pagos" element={<CajaPagos />} />
        <Route path="/secretaria/editar-perfil" element={<EditarPerfil />} />
        <Route path="/secretaria/checking-pacientes" element={<CheckingPacientes />} />
      </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default App