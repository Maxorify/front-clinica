import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'; 
import Login from './pages/login/Login'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  
  return (
    <Routes>
      <Route path="/" element={<h1>Hello, World!</h1>} />
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}

export default App