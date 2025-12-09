// src/components/SideBar.jsx
import "../styles/sidebar.css";
import { Link, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiHome,
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";

const menuItems = [
  { icon: FiGrid, label: "Dashboard", path: "/dashboard" },
  { icon: FiHome, label: "Households", path: "/households" },
  { icon: FiUsers, label: "Residents", path: "/residents" },
  { icon: FiTrendingUp, label: "Revenues", path: "/revenues" },
  { icon: FiTrendingDown, label: "Expenses", path: "/expenses" },
];

export default function SideBar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Menu</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
