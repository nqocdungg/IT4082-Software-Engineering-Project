import { Navigate, Outlet } from "react-router-dom"

export default function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem("token")
  const userRole = localStorage.getItem("role")

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(userRole)) {
    if (userRole === "HOUSEHOLD") return <Navigate to="/resident-home" replace />
    return <Navigate to="/dashboard" replace />
  }

  return children ? children : <Outlet />
}