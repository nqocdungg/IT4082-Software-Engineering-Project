import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import StaffLayout from "./components/staff/Layout"
import ProtectedRoute from "./components/ProtectedRoute"

import StaffDashboard from "./pages/staff/Dashboard"
import StaffHouseholds from "./pages/staff/Households"
import StaffCreateHousehold from "./pages/staff/CreateHousehold"
import StaffResidents from "./pages/staff/Residents"
import StaffRevenues from "./pages/staff/Revenues"
import StaffResidentChange from "./pages/staff/ResidentChange"

import ResidentHome from "./pages/resident/ResidentHome.jsx"
import HouseholdInfo from "./pages/resident/HouseholdInfo.jsx"

import Login from "./pages/Login"

import "./index.css"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* STAFF */}
        <Route
          element={
            <ProtectedRoute roles={["HEAD", "DEPUTY", "ACCOUNTANT"]}>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<StaffDashboard />} />
          <Route path="/households" element={<StaffHouseholds />} />
          <Route path="/households/create" element={<StaffCreateHousehold />} />
          <Route path="/residents" element={<StaffResidents />} />
          <Route path="/revenues" element={<StaffRevenues />} />
          <Route path="/resident-change" element={<StaffResidentChange />} />
        </Route>

        {/* HOUSEHOLD / RESIDENT */}
        <Route
          element={
            <ProtectedRoute roles={["HOUSEHOLD"]}/>
          }
        >
          <Route path="/resident-home" element={<ResidentHome />} />
          <Route path="/resident/household/info" element={<HouseholdInfo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
