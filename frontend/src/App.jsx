import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Layout from "./components/Layout"
import ProtectedRoute from "./components/ProtectedRoute"

import Dashboard from "./pages/Dashboard"
import Households from "./pages/Households"
import Residents from "./pages/Residents"
import Revenues from "./pages/Revenues"
import Login from "./pages/Login"

import "./index.css"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/households" element={<Households />} />
          <Route path="/residents" element={<Residents />} />
          <Route path="/revenues" element={<Revenues />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
