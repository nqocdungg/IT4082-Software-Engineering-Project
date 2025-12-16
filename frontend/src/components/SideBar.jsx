import "../styles/sidebar.css"
import { Link, useLocation } from "react-router-dom"
import { FiGrid, FiHome, FiUsers, FiTrendingUp, FiTrendingDown } from "react-icons/fi"
import logo from "../assets/images/new-logo.png"

const menuItems = [
  { icon: FiGrid, label: "Thống kê", path: "/dashboard" },
  { icon: FiHome, label: "Hộ khẩu", path: "/households" },
  { icon: FiUsers, label: "Cư dân", path: "/residents" },
  { icon: FiTrendingUp, label: "Khoản thu", path: "/revenues" }
]

export default function SideBar() {
  const location = useLocation()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="CiviHub Logo" />
        <span className="sidebar-brand">CIVIHUB</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <Link key={item.path} to={item.path} className={`nav-item ${isActive ? "active" : ""}`}>
              <Icon />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
