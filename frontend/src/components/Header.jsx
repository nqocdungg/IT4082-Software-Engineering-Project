// src/components/Header.jsx
import "../styles/header.css";
import { FiMenu, FiUser } from "react-icons/fi";

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <button className="icon-btn">
          <FiMenu />
        </button>
        <span className="logo-text">ADMIN</span>
      </div>

      <div className="header-right">
        <span className="welcome-label">Welcome, Admin</span>
        <button className="icon-btn">
          <FiUser />
        </button>
      </div>
    </header>
  );
}
