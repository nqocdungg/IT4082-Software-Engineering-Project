import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Households from "./pages/Households";
import Residents from "./pages/Residents";
import Revenues from "./pages/Revenues";
import Expenses from "./pages/Expenses";
import Login from "./pages/Login";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/households" element={<Households />} />
        <Route path="/residents" element={<Residents />} />
        <Route path="/revenues" element={<Revenues />} />
        <Route path="/expenses" element={<Expenses />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
