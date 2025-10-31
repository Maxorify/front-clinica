import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'; 
import Login from './pages/login/Login'
import Layout from './components/layout/Layout'
import LayoutDoctor from './components/layout/LayoutDoctor'
import LayoutSecretaria from './components/layout/LayoutSecretaria'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  
  return (
    <Routes>
      <Route path="/" element={<Login/>} />
      <Route element= {<Layout/>}>
      {/* Rutas protegidas aquí para admin */}
        
      </Route>

      <Route element= {<LayoutDoctor/>}>
      {/* Rutas protegidas aquí para doctor */}
      </Route>

      <Route element= {<LayoutSecretaria/>}>
      {/* Rutas protegidas aquí para Secretaria */}
      </Route>
    </Routes>
    
  )
}

export default App