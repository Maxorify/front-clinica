import { Routes, Route } from 'react-router-dom';
import Login from './pages/login/Login'

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
import AsignarHorarios from './pages/admin/asignarHorarios';
import RegistroAsistencia from './pages/admin/registroAsistencia';
import AjustesSistema from './pages/admin/ajustesSistema';

// Doctor Pages
import DashboardDoctor from './pages/doctor/DashboardDoctor';
import CitasDoctor from './pages/doctor/CitasDoctor';

// Secretaria Pages

import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login/>} />

      {/* Rutas Admin */}
      <Route element={<Layout/>}>
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/agendamiento-consultas" element={<AgendamientoConsultas />} />
        <Route path="/admin/doctores" element={<Doctores />} />
        <Route path="/admin/pacientes" element={<Pacientes />} />
        <Route path="/admin/usuarios-sistema" element={<UsuariosSistema />} />
        <Route path="/admin/asignar-horarios" element={<AsignarHorarios />} />
        <Route path="/admin/registro-asistencia" element={<RegistroAsistencia />} />
        <Route path="/admin/ajustes-sistema" element={<AjustesSistema />} />
      </Route>

      {/* Rutas Doctor */}
      <Route element={<LayoutDoctor/>}>
        <Route path="/doctor/dashboard" element={<DashboardDoctor />} />
        <Route path="/doctor/citas" element={<CitasDoctor />} />
      </Route>

      {/* Rutas Secretaria */}
      <Route element={<LayoutSecretaria/>}>
      {
          /*
        <Route path="/secretaria/dashboard" element={<DashboardSecretaria />} />
        <Route path="/secretaria/agendar-cita" element={<AgendarCita />} />
        <Route path="/secretaria/checking-pacientes" element={<CheckingPacientes />} />
        <Route path="/secretaria/caja-pagos" element={<CajaPagos />} />
        <Route path="/secretaria/editar-perfil" element={<EditarPerfil />} />*/

      }
      </Route>
    </Routes>
  )
}

export default App