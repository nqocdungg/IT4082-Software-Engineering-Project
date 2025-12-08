import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import Households from "./pages/Households"
import Residents from "./pages/Residents"
import Revenues from "./pages/Revenues"
import Expenses from "./pages/Expenses"
import Login from "./pages/Login"
import ProtectedRoute from "./components/ProtectedRoute"
import "./index.css"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/residents" element={<ProtectedRoute><Residents /></ProtectedRoute>} />
        <Route path="/households" element={<ProtectedRoute><Households /></ProtectedRoute>} />
        <Route path="/revenues" element={<ProtectedRoute><Revenues /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
