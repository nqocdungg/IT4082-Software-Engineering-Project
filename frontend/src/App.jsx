import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} /> {/* Trang login */}
        <Route path="/dashboard" element={<Dashboard />} />{" "}
        {/* Trang dashboard */}
      </Routes>
    </Router>
  );
}

export default App;
