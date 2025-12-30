import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import StaffLayout from "./components/staff/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import StaffDashboard from "./pages/staff/Dashboard";
import StaffHouseholds from "./pages/staff/Households";
import StaffCreateHousehold from "./pages/staff/CreateHousehold";
import StaffResidents from "./pages/staff/Residents";
import StaffRevenues from "./pages/staff/Revenues";
import StaffResidentChange from "./pages/staff/ResidentChange";
import StaffRevenuesDetail from "./pages/staff/RevenuesDetail";
import StaffCreateResidentChange from "./pages/staff/CreateResidentChange.jsx";
import StaffFeeReport from "./pages/staff/FeeReport.jsx";
import StaffFeeReportDetail from "./pages/staff/FeeReportDetail.jsx"
import StaffFeeHistory from "./pages/staff/FeeHistory.jsx"
import StaffCreateNotification from "./pages/staff/CreateNotification";

import ResidentHome from "./pages/resident/ResidentHome.jsx";
import HouseholdInfo from "./pages/resident/HouseholdInfo.jsx";

import InvoiceInfo from "./pages/resident/InvoiceInfo.jsx";
import InvoicePayment from "./pages/resident/InvoicePayment.jsx";
import FeeHistory from "./pages/resident/InvoiceHistory.jsx";
import Login from "./pages/Login";
import ResidentNotifications from "./pages/resident/ResidentNotifications"

import "./index.css";

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
          <Route path="/resident-changes" element={<StaffResidentChange />} />
          <Route path="/revenues/:id" element={<StaffRevenuesDetail />} />
          <Route path="/staff/resident-changes/create"element={<StaffCreateResidentChange />}/>
          <Route path ="/fees-report" element = {<StaffFeeReport/>}/>
          <Route path="/fees-report/:feeTypeId" element={<StaffFeeReportDetail />} />
          <Route path ="/fees-history" element = {<StaffFeeHistory/>}/>
          <Route path="/notifications/create" element={<StaffCreateNotification />} />
        </Route>

        {/* HOUSEHOLD / RESIDENT */}
        <Route element={<ProtectedRoute roles={["HOUSEHOLD"]} />}>
          <Route path="/resident-home" element={<ResidentHome />} />
          <Route path="/resident/household/info" element={<HouseholdInfo />} />
          <Route path="/resident/payment-infor" element={<InvoiceInfo />} />{" "}
          <Route path="/resident/payment" element={<InvoicePayment />} />{" "}
          <Route path="/resident/history" element={<FeeHistory />} />
          <Route path="/resident/notifications" element={<ResidentNotifications />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
