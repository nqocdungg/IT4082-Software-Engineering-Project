import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import StaffDashboard from "./pages/staff/Dashboard";
import StaffHouseholds from "./pages/staff/Households";
import StaffResidents from "./pages/staff/Residents";
import StaffRevenues from "./pages/staff/Revenues";
import ResidentHome from "./pages/resident/ResidentHome.jsx";
import HouseholdInfo from "./pages/resident/HouseholdInfo.jsx";

import Login from "./pages/Login";

import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<StaffDashboard />} />
        <Route path="/households" element={<StaffHouseholds />} />
        <Route path="/residents" element={<StaffResidents />} />
        <Route path="/revenues" element={<StaffRevenues />} />

        <Route path="/resident-home" element={<ResidentHome />} />
        <Route path="/resident/household/info" element={<HouseholdInfo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
