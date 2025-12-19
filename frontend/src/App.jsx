import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import StaffLayout from "./components/staff/Layout"
import ProtectedRoute from "./components/ProtectedRoute"

import StaffDashboard from "./pages/staff/Dashboard"
import StaffHouseholds from "./pages/staff/Households"
import StaffResidents from "./pages/staff/Residents"
import StaffRevenues from "./pages/staff/Revenues"
import Login from "./pages/Login"

import "./index.css"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute roles={["HEAD", "DEPUTY", "ACCOUNTANT"]}><StaffLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<StaffDashboard />} />
          <Route path="/households" element={<StaffHouseholds />} />
          <Route path="/residents" element={<StaffResidents />} />
          <Route path="/revenues" element={<StaffRevenues />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
