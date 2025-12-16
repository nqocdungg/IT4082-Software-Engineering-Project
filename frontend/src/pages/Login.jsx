import { useNavigate } from "react-router-dom"
import Authentication from "../components/Authentication"
import SlideShow from "../components/SlideShow.jsx"
import "../styles/Login.css"

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="login-container">
      <SlideShow />
      <Authentication
        mode="login"
        onSuccess={() => {
          const role = localStorage.getItem("role")?.toLowerCase()

          if (role === "head") navigate("/dashboard")
          else if (role === "deputy") navigate("/dashboard")
          else if (role === "accountant") navigate("/dashboard")
          else if (role === "household") navigate("/")
          else navigate("/")
        }}
      />
    </div>
  )
}
