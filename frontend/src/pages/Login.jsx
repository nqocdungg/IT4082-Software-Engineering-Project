import { Navigate } from "react-router-dom";
import Authentication from "../components/Authentication.jsx";
import Slideshow from "../components/SlideShow.jsx";
import "./Login.css";

function Login() {
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-container">
      <Slideshow />
      <Authentication />
    </div>
  );
}

export default Login;
